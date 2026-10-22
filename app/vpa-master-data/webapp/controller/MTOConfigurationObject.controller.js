
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/NumberFormat",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator"
], function (
    Controller,
    JSONModel,
    Filter,
    FilterOperator,
    NumberFormat,
    MessageToast,
    MessageBox,
    BusyIndicator
) {
    "use strict";

    const GROUP = "partsGroup";
    const HEADER_GROUP = "headerGroup";
    const LIST_ROUTE = "mtoConfigurations";

    return Controller.extend(
        "vpamasterdata.controller.MTOConfigurationObject", {

        // =========================
        // INIT
        // =========================

        onInit: function () {

            this.getView().setModel(
                new JSONModel({
                    grandTotal: "0.00",
                    editHeader: false,
                    isCreateMode: false,
                    canEdit: false
                }),
                "viewModel"
            );

            this.getView().setModel(
                new JSONModel({}),
                "partsLookup"
            );

            this.getView().setModel(
                new JSONModel({ items: [] }),
                "partsList"
            );

            this.getView().setModel(
                new JSONModel({ mts: [] }),
                "modelsList"
            );

            // Existing parts selected for deletion.
            // Deletion is executed only after Save.
            this._aPendingDeletes = [];

            this._loadPartsLookup();
            this._loadModels();

            const oRouter = this.getOwnerComponent().getRouter();

            oRouter.getRoute("MTOConfigurationObject")
                .attachPatternMatched(this._onObjectMatched, this);

            oRouter.getRoute("MTOConfigurationCreate")
                .attachPatternMatched(this._onCreateMatched, this);
        },

        // =========================
        // CREATE MODE
        // =========================

        _onCreateMatched: function () {

            const oCreateModel = this.getOwnerComponent()
                .getModel("mtoCreateModel");

            if (!oCreateModel) {

                BusyIndicator.hide();

                MessageBox.warning(
                    "No new MTO configuration found."
                );

                this.getOwnerComponent()
                    .getRouter()
                    .navTo(LIST_ROUTE);

                return;
            }

            this.getView().unbindElement();

            this.getView().setModel(
                oCreateModel,
                "mtoCreateModel"
            );

            const oViewModel = this.getView()
                .getModel("viewModel");

            oViewModel.setProperty("/isCreateMode", true);
            oViewModel.setProperty("/editHeader", false);

            this._recalcTotal();

            // Create data is already available in JSONModel
            BusyIndicator.hide();
        },

        // =========================
        // EXISTING CONFIGURATION
        // =========================


        _onObjectMatched: function (oEvent) {

            const oModel = this.getView().getModel();

            const oViewModel = this.getView()
                .getModel("viewModel");

            // Reset state whenever an existing configuration opens
            oViewModel.setProperty("/isCreateMode", false);
            oViewModel.setProperty("/editHeader", false);
            oViewModel.setProperty("/canEdit", false);
            oViewModel.setProperty("/grandTotal", "0.00");

            this._aPendingDeletes = [];

            [GROUP, HEADER_GROUP].forEach(sGroup => {

                if (oModel.hasPendingChanges(sGroup)) {
                    oModel.resetChanges(sGroup);
                }

            });

            const sCode = decodeURIComponent(
                oEvent.getParameter("arguments").mtoModelCode
            ).replace(/'/g, "''");

            this.getView().bindElement({

                path: "/MTOConfigurations('" + sCode + "')",

                parameters: {
                    $$updateGroupId: HEADER_GROUP
                },

                events: {

                    dataReceived: function (oEvent) {

                        BusyIndicator.hide();

                        if (oEvent.getParameter("error")) {

                            MessageBox.error(
                                "Failed to load MTO configuration."
                            );

                            return;
                        }

                        const oContext = this.getView()
                            .getBindingContext();

                        if (oContext) {

                            const sStatus = oContext.getProperty(
                                "approvalStatus"
                            );

                            console.log("Approval Status:", sStatus);

                            oViewModel.setProperty(
                                "/canEdit",
                                sStatus !== "SUBMITTED"
                            );
                        }

                        this._recalcTotalLater();

                    }.bind(this)

                }

            });
        },


        // =========================
        // NAVIGATION
        // =========================

        onNavBack: function () {

            const oViewModel = this.getView()
                .getModel("viewModel");

            if (oViewModel.getProperty("/isCreateMode")) {
                this.onCancelCreate();
                return;
            }

            const oModel = this.getView().getModel();

            const fnBack = () => {

                oModel.resetChanges(GROUP);
                oModel.resetChanges(HEADER_GROUP);

                this._aPendingDeletes = [];

                oViewModel.setProperty("/editHeader", false);

                this.getOwnerComponent()
                    .getRouter()
                    .navTo(LIST_ROUTE);
            };

            if (
                !oModel.hasPendingChanges(GROUP) &&
                !oModel.hasPendingChanges(HEADER_GROUP) &&
                !this._aPendingDeletes.length &&
                !oViewModel.getProperty("/editHeader")
            ) {
                fnBack();
                return;
            }

            MessageBox.confirm(
                "You have unsaved changes. Discard them?",
                {
                    onClose: sAction => {

                        if (sAction === MessageBox.Action.OK) {
                            fnBack();
                        }

                    }
                }
            );
        },

        onCancelCreate: function () {

            MessageBox.confirm(
                "Discard this new MTO configuration?",
                {
                    title: "Cancel Configuration",

                    onClose: sAction => {

                        if (sAction !== MessageBox.Action.OK) {
                            return;
                        }

                        this.getOwnerComponent().setModel(
                            null,
                            "mtoCreateModel"
                        );

                        this.getView()
                            .getModel("viewModel")
                            .setProperty("/isCreateMode", false);

                        this.getOwnerComponent()
                            .getRouter()
                            .navTo(LIST_ROUTE);
                    }
                }
            );
        },

        // =========================
        // LOAD LOOKUP DATA
        // =========================

        _loadPartsLookup: function () {

            const oModel = this.getOwnerComponent().getModel();

            oModel.bindList(
                "/Parts",
                null,
                null,
                null,
                {
                    $select:
                        "partCode,description,miyCost,miyMarkup,priceIndicator"
                }
            )
                .requestContexts(0, 5000)
                .then(aContexts => {

                    const aParts = aContexts.map(
                        oCtx => ({ ...oCtx.getObject() })
                    );

                    const mParts = {};

                    aParts.forEach(oPart => {
                        mParts[oPart.partCode] = oPart;
                    });

                    this.getView()
                        .getModel("partsLookup")
                        .setData(mParts);

                    this.getView()
                        .getModel("partsList")
                        .setData({ items: aParts });

                    this._recalcTotal();

                })
                .catch(oError => {
                    console.error("Parts lookup failed", oError);
                });
        },

        _loadModels: function () {

            const oModel = this.getOwnerComponent().getModel();

            oModel.bindList(
                "/Models",
                null,
                null,
                [
                    new Filter(
                        "orderType",
                        FilterOperator.EQ,
                        "MTS"
                    )
                ],
                {
                    $select:
                        "modelCode,modelDescription,orderType",

                    $orderby: "modelCode"
                }
            )
                .requestContexts(0, 5000)
                .then(aContexts => {

                    const aModels = aContexts.map(
                        oCtx => ({ ...oCtx.getObject() })
                    );

                    this.getView()
                        .getModel("modelsList")
                        .setProperty("/mts", aModels);

                })
                .catch(oError => {
                    console.error("Loading MTS models failed", oError);
                });
        },

        // =========================
        // FORMATTERS
        // =========================

        _partField: function (sCode, mParts, sField) {

            return (
                sCode &&
                mParts &&
                mParts[sCode]
            )
                ? mParts[sCode][sField]
                : "";
        },

        fmtDescription: function (sCode, mParts) {
            return this._partField(
                sCode,
                mParts,
                "description"
            );
        },

        fmtMiyCost: function (sCode, mParts) {
            return this._partField(
                sCode,
                mParts,
                "miyCost"
            );
        },

        fmtMiyMarkup: function (sCode, mParts) {
            return this._partField(
                sCode,
                mParts,
                "miyMarkup"
            );
        },

        fmtPriceIndicator: function (sCode, mParts) {
            return this._partField(
                sCode,
                mParts,
                "priceIndicator"
            );
        },

        // =========================
        // AMOUNT CALCULATION
        // =========================

        _fmtAmount: function (fValue) {

            return NumberFormat.getFloatInstance({
                minFractionDigits: 2,
                maxFractionDigits: 2
            }).format(fValue);
        },

        _unit: function (sCode, mParts) {

            const oPart = (
                sCode &&
                mParts
            )
                ? mParts[sCode]
                : null;

            if (!oPart) {
                return 0;
            }

            return (
                (parseFloat(oPart.miyCost) || 0) +
                (parseFloat(oPart.miyMarkup) || 0)
            );
        },

        _lineTotal: function (sCode, iQty, mParts) {

            return this._unit(sCode, mParts) *
                (Number(iQty) || 0);
        },

        fmtUnitPrice: function (sCode, mParts) {

            return this._fmtAmount(
                this._unit(sCode, mParts)
            );
        },

        fmtLineTotal: function (sCode, iQty, mParts) {

            return this._fmtAmount(
                this._lineTotal(sCode, iQty, mParts)
            );
        },

        _isPendingDelete: function (oContext) {

            return this._aPendingDeletes.some(
                oEntry => oEntry.context === oContext
            );
        },

        _recalcTotal: function () {

            const oViewModel = this.getView()
                .getModel("viewModel");

            const bCreateMode = oViewModel
                .getProperty("/isCreateMode");

            const mParts = this.getView()
                .getModel("partsLookup")
                .getData();

            let fTotal = 0;

            if (bCreateMode) {

                const oCreateModel = this.getView()
                    .getModel("mtoCreateModel");

                if (!oCreateModel) {
                    return;
                }

                const aParts =
                    oCreateModel.getProperty("/parts") || [];

                aParts.forEach(oPart => {

                    fTotal += this._lineTotal(
                        oPart.part_partCode,
                        oPart.quantity,
                        mParts
                    );

                });

            } else {

                const oBinding = this.byId("mtoPartsTable")
                    .getBinding("items");

                if (!oBinding) {
                    return;
                }

                oBinding.getAllCurrentContexts()
                    .forEach(oCtx => {

                        if (
                            oCtx.isInactive() ||
                            this._isPendingDelete(oCtx)
                        ) {
                            return;
                        }

                        fTotal += this._lineTotal(
                            oCtx.getProperty("part_partCode"),
                            oCtx.getProperty("quantity"),
                            mParts
                        );

                    });
            }

            oViewModel.setProperty(
                "/grandTotal",
                this._fmtAmount(fTotal)
            );
        },

        _recalcTotalLater: function () {

            setTimeout(() => {
                this._recalcTotal();
            }, 0);
        },

        onQuantityChange: function () {
            this._recalcTotalLater();
        },

        onTableUpdateFinished: function () {
            this._recalcTotal();
        },

        // =========================
        // HEADER AND PARTS EDITING
        // =========================

        onEdit: function () {

            this._loadModels();

            this.getView()
                .getModel("viewModel")
                .setProperty("/editHeader", true);
        },

        // =========================
        // SAVE COMPLETE CONFIGURATION
        // =========================

        onSaveHeader: async function () {

            const oModel = this.getView().getModel();

            const oContext = this.getView()
                .getBindingContext();

            if (!oContext) {
                MessageBox.error("Configuration not found.");
                return;
            }

            if (!oContext.getProperty(
                "referenceMTSModel_modelCode"
            )) {

                MessageBox.error(
                    "Please select a reference MTS model."
                );

                return;
            }

            const sValidFrom = oContext.getProperty("validFrom");

            if (!sValidFrom) {

                MessageBox.error("Valid From is required.");
                return;
            }

            const oPartsBinding = this.byId("mtoPartsTable")
                .getBinding("items");

            if (!oPartsBinding) {

                MessageBox.error("Parts data is not available.");
                return;
            }

            const aSeen = new Set();

            // Validate all parts except staged deletions
            for (const oCtx of oPartsBinding.getAllCurrentContexts()) {

                if (
                    oCtx.isInactive() ||
                    this._isPendingDelete(oCtx)
                ) {
                    continue;
                }

                const sPart = oCtx.getProperty(
                    "part_partCode"
                );

                const iQty = Number(
                    oCtx.getProperty("quantity")
                );

                if (!sPart) {

                    MessageBox.error(
                        "Please select a part in every row."
                    );

                    return;
                }

                if (aSeen.has(sPart)) {

                    MessageBox.error(
                        "Part " + sPart +
                        " is added more than once. " +
                        "Increase its quantity instead."
                    );

                    return;
                }

                aSeen.add(sPart);

                if (
                    !Number.isInteger(iQty) ||
                    iQty <= 0
                ) {

                    MessageBox.error(
                        "Quantity must be a positive whole number."
                    );

                    return;
                }
            }

            this.getView().setBusy(true);

            try {

                // Save Header changes
                if (oModel.hasPendingChanges(HEADER_GROUP)) {
                    await oModel.submitBatch(HEADER_GROUP);
                }

                // Save Parts changes
                if (oModel.hasPendingChanges(GROUP)) {
                    await oModel.submitBatch(GROUP);
                }

                if (
                    oModel.hasPendingChanges(HEADER_GROUP) ||
                    oModel.hasPendingChanges(GROUP)
                ) {

                    MessageBox.error(
                        "Save failed. Please check the entries."
                    );

                    return;
                }

                // Execute staged deletions only after
                // the other changes have been saved.
                for (const oEntry of [...this._aPendingDeletes]) {

                    await oEntry.context.delete("$auto");

                    this._aPendingDeletes =
                        this._aPendingDeletes.filter(
                            oItem => oItem !== oEntry
                        );
                }

                this.getView()
                    .getModel("viewModel")
                    .setProperty("/editHeader", false);

                this._recalcTotal();

                MessageToast.show(
                    "Configuration saved successfully."
                );

            } catch (oError) {

                console.error("Configuration save failed:", oError);

                MessageBox.error(
                    oError.message ||
                    "Failed to save configuration."
                );

            } finally {

                this.getView().setBusy(false);

            }
        },

        // =========================
        // CANCEL COMPLETE CONFIGURATION
        // =========================

        onCancelHeader: function () {

            const oModel = this.getView().getModel();

            oModel.resetChanges(HEADER_GROUP);
            oModel.resetChanges(GROUP);

            // Discard staged deletions
            this._aPendingDeletes = [];

            this.getView()
                .getModel("viewModel")
                .setProperty("/editHeader", false);

            this._recalcTotal();

            MessageToast.show("Changes discarded.");
        },

        // Both Parts buttons reuse the same handlers
        onSaveParts: function () {
            return this.onSaveHeader();
        },

        onCancelParts: function () {
            this.onCancelHeader();
        },

        // =========================
        // DELETE CONFIGURATION
        // =========================

        onDelete: function () {

            const oContext = this.getView()
                .getBindingContext();

            if (!oContext) {

                MessageToast.show("Configuration not found");
                return;
            }

            MessageBox.confirm(
                "Do you want to delete this MTO configuration?",
                {
                    title: "Delete Configuration",

                    onClose: async sAction => {

                        if (sAction !== MessageBox.Action.OK) {
                            return;
                        }

                        try {

                            await oContext.delete("$auto");

                            MessageToast.show(
                                "Configuration deleted"
                            );

                            this.getOwnerComponent()
                                .getRouter()
                                .navTo(LIST_ROUTE);

                        } catch (oError) {

                            console.error(oError);

                            MessageBox.error(
                                "Failed to delete configuration"
                            );
                        }
                    }
                }
            );
        },

        // =========================
        // ADD PART
        // =========================

        onAddPart: function () {

            const oViewModel = this.getView()
                .getModel("viewModel");

            const bCreateMode = oViewModel
                .getProperty("/isCreateMode");

            // CREATE MODE
            if (bCreateMode) {

                const oCreateModel = this.getView()
                    .getModel("mtoCreateModel");

                const aParts =
                    oCreateModel.getProperty("/parts") || [];

                oCreateModel.setProperty(
                    "/parts",
                    [
                        ...aParts,
                        {
                            part_partCode: "",
                            quantity: 1
                        }
                    ]
                );

                this._recalcTotal();

                return;
            }

            // EXISTING MODE
            if (!oViewModel.getProperty("/editHeader")) {

                MessageToast.show(
                    "Click Edit to modify parts."
                );

                return;
            }

            const oBinding = this.byId("mtoPartsTable")
                .getBinding("items");

            if (!oBinding) {

                MessageBox.error("Parts table is not ready.");
                return;
            }

            oBinding.create(
                { quantity: 1 },
                true,
                false,
                true
            );
        },

        // =========================
        // PART SELECTION
        // =========================

        onPartChange: function (oEvent) {

            const oCombo = oEvent.getSource();

            const oItem = oCombo.getSelectedItem();

            if (!oItem) {
                return;
            }

            const bCreateMode = this.getView()
                .getModel("viewModel")
                .getProperty("/isCreateMode");

            const oContext = oCombo.getBindingContext(
                bCreateMode
                    ? "mtoCreateModel"
                    : undefined
            );

            if (!oContext) {
                return;
            }

            oContext.setProperty(
                "part_partCode",
                oItem.getKey()
            );

            this._recalcTotalLater();
        },

        // =========================
        // DELETE PART
        // =========================

        onDeletePart: function (oEvent) {

            const oViewModel = this.getView()
                .getModel("viewModel");

            const bCreateMode = oViewModel
                .getProperty("/isCreateMode");

            // CREATE MODE
            if (bCreateMode) {

                const oCreateModel = this.getView()
                    .getModel("mtoCreateModel");

                const oContext = oEvent.getSource()
                    .getBindingContext("mtoCreateModel");

                if (!oContext) {
                    return;
                }

                const iIndex = Number(
                    oContext.getPath().split("/").pop()
                );

                const aParts = [
                    ...(oCreateModel.getProperty("/parts") || [])
                ];

                aParts.splice(iIndex, 1);

                oCreateModel.setProperty(
                    "/parts",
                    aParts
                );

                this._recalcTotal();

                return;
            }

            // EXISTING MODE
            if (!oViewModel.getProperty("/editHeader")) {

                MessageToast.show(
                    "Click Edit to modify parts."
                );

                return;
            }

            const oContext = oEvent.getSource()
                .getBindingContext();

            if (!oContext) {

                MessageToast.show("Part not found");
                return;
            }

            // Unsaved newly added part can be removed directly
            if (
                oContext.isInactive() ||
                oContext.isTransient()
            ) {

                oContext.delete()
                    .catch(oError => {
                        console.error(
                            "Failed to discard new part:",
                            oError
                        );
                    })
                    .finally(() => this._recalcTotal());

                return;
            }

            const sPart = oContext.getProperty(
                "part_partCode"
            ) || "";

            // If already staged, do not add it again
            if (this._isPendingDelete(oContext)) {

                MessageToast.show(
                    "This part is already marked for deletion."
                );

                return;
            }

            MessageBox.confirm(
                "Mark part " + sPart +
                " for deletion? It will be deleted when you click Save.",
                {
                    title: "Delete Part",

                    onClose: sAction => {

                        if (sAction !== MessageBox.Action.OK) {
                            return;
                        }

                        this._aPendingDeletes.push({
                            context: oContext,
                            partCode: sPart
                        });

                        MessageToast.show(
                            "Part marked for deletion. Click Save to confirm."
                        );

                        this._recalcTotal();
                    }
                }
            );
        },

        // =========================
        // SUBMIT NEW CONFIGURATION
        // =========================

        onSubmitCreate: async function () {

            const oCreateModel = this.getView()
                .getModel("mtoCreateModel");

            if (!oCreateModel) {

                MessageBox.error(
                    "Configuration data not found."
                );

                return;
            }

            const oHeader =
                oCreateModel.getProperty("/header") || {};

            const aParts =
                oCreateModel.getProperty("/parts") || [];

            // HEADER VALIDATION

            if (!oHeader.mtoModelCode) {

                MessageBox.error("MTO Model is required.");
                return;
            }

            if (!oHeader.referenceMTSModel_modelCode) {

                MessageBox.error(
                    "Reference MTS Model is required."
                );

                return;
            }

            if (!oHeader.validFrom) {

                MessageBox.error("Valid From is required.");
                return;
            }

            // PARTS VALIDATION

            if (aParts.length === 0) {

                MessageBox.error(
                    "Please add at least one part."
                );

                return;
            }

            const aSeen = new Set();

            for (const oPart of aParts) {

                if (!oPart.part_partCode) {

                    MessageBox.error(
                        "Please select a part in every row."
                    );

                    return;
                }

                if (aSeen.has(oPart.part_partCode)) {

                    MessageBox.error(
                        "Part " + oPart.part_partCode +
                        " is added more than once. " +
                        "Increase its quantity instead."
                    );

                    return;
                }

                aSeen.add(oPart.part_partCode);

                const iQuantity = Number(oPart.quantity);

                if (
                    !Number.isInteger(iQuantity) ||
                    iQuantity <= 0
                ) {

                    MessageBox.error(
                        "Quantity must be a positive whole number."
                    );

                    return;
                }
            }

            // =========================
            // FINAL PAYLOAD
            // =========================

            const oPayload = {

                mtoModelCode:
                    oHeader.mtoModelCode,

                referenceMTSModel_modelCode:
                    oHeader.referenceMTSModel_modelCode,

                validFrom:
                    oHeader.validFrom,

                approvalStatus: "SUBMITTED",

                parts: aParts.map(oPart => ({

                    part_partCode:
                        oPart.part_partCode,

                    quantity:
                        Number(oPart.quantity)

                }))
            };

            console.log(
                "Final MTO Configuration Payload:",
                oPayload
            );

            // =========================
            // ODATA V4 DEEP CREATE
            // =========================

            const oModel = this.getView().getModel();

            this.getView().setBusy(true);

            try {

                const oBinding = oModel.bindList(
                    "/MTOConfigurations",
                    null,
                    null,
                    null,
                    {
                        $$updateGroupId: HEADER_GROUP
                    }
                );

                const oContext = oBinding.create(oPayload);

                await oModel.submitBatch(HEADER_GROUP);

                // Wait until the backend confirms creation
                await oContext.created();

                MessageToast.show(
                    "MTO Configuration submitted successfully."
                );

                // Clear temporary creation data only after success
                this.getOwnerComponent().setModel(
                    null,
                    "mtoCreateModel"
                );

                this.getView()
                    .getModel("viewModel")
                    .setProperty("/isCreateMode", false);

                this.getOwnerComponent()
                    .getRouter()
                    .navTo(LIST_ROUTE);

            } catch (oError) {

                console.error(
                    "MTO Configuration creation failed:",
                    oError
                );

                MessageBox.error(
                    oError.message ||
                    "Failed to submit MTO configuration."
                );

            } finally {

                this.getView().setBusy(false);

            }
        }

    });
});
