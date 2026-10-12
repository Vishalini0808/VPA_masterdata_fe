sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/NumberFormat",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, Filter, FilterOperator, NumberFormat, MessageToast, MessageBox) {
    "use strict";

    const GROUP = "partsGroup";        // parts table changes
    const HEADER_GROUP = "headerGroup"; // reference MTS / valid from edits
    const LIST_ROUTE = "mtoConfigurations"; // change if your list route has a different name

    return Controller.extend("vpamasterdata.controller.MTOConfigurationObject", {

        // ---------------- Init ----------------

        onInit: function () {
            this.getView().setModel(new JSONModel({ grandTotal: "0.00", editHeader: false }), "viewModel");
            this.getView().setModel(new JSONModel({}), "partsLookup");
            this.getView().setModel(new JSONModel({ items: [] }), "partsList");
            this.getView().setModel(new JSONModel({ mts: [] }), "modelsList");
            this._loadPartsLookup();
            this._loadModels();

            this.getOwnerComponent()
                .getRouter()
                .getRoute("MTOConfigurationObject")
                .attachPatternMatched(this._onObjectMatched, this);
        },

        // Local copy of all Parts, keyed by partCode, used to fill the row on selection
        _loadPartsLookup: function () {
            const oModel = this.getOwnerComponent().getModel();
            oModel.bindList("/Parts", null, null, null, {
                $select: "partCode,description,miyCost,miyMarkup,priceIndicator"
            }).requestContexts(0, 5000).then((aContexts) => {
                const aParts = aContexts.map((oCtx) => ({ ...oCtx.getObject() }));
                const mParts = {};
                aParts.forEach((oPart) => { mParts[oPart.partCode] = oPart; });
                this.getView().getModel("partsLookup").setData(mParts);
                this.getView().getModel("partsList").setData({ items: aParts });
                this._recalcTotal();
            }).catch((oError) => console.error("Parts lookup failed", oError));
        },

        // MTS models for the reference dropdown in the header edit
        _loadModels: function () {
            const oModel = this.getOwnerComponent().getModel();
            oModel.bindList("/Models", null, null,
                [new Filter("orderType", FilterOperator.EQ, "MTS")],
                { $select: "modelCode,modelDescription,orderType", $orderby: "modelCode" }
            ).requestContexts(0, 5000).then((aContexts) => {
                this.getView().getModel("modelsList").setProperty(
                    "/mts", aContexts.map((oCtx) => ({ ...oCtx.getObject() }))
                );
            }).catch((oError) => console.error("Loading MTS models failed", oError));
        },

        _onObjectMatched: function (oEvent) {
            const oModel = this.getView().getModel();
            // drop unsaved changes left over from a previous visit
            [GROUP, HEADER_GROUP].forEach((sGroup) => {
                if (oModel.hasPendingChanges(sGroup)) { oModel.resetChanges(sGroup); }
            });
            this.getView().getModel("viewModel").setProperty("/editHeader", false);

            const sCode = decodeURIComponent(oEvent.getParameter("arguments").mtoModelCode)
                .replace(/'/g, "''");
            this.getView().bindElement({
                path: "/MTOConfigurations('" + sCode + "')",
                parameters: { $$updateGroupId: HEADER_GROUP }
            });
        },

        onNavBack: function () {
            const oModel = this.getView().getModel();
            const fnBack = () => {
                oModel.resetChanges(GROUP);
                oModel.resetChanges(HEADER_GROUP);
                this.getView().getModel("viewModel").setProperty("/editHeader", false);
                this.getOwnerComponent().getRouter().navTo(LIST_ROUTE);
            };
            if (!oModel.hasPendingChanges(GROUP) && !oModel.hasPendingChanges(HEADER_GROUP) &&
                !this.getView().getModel("viewModel").getProperty("/editHeader")) {
                fnBack();
                return;
            }
            MessageBox.confirm("You have unsaved changes. Discard them?", {
                onClose: (sAction) => { if (sAction === MessageBox.Action.OK) { fnBack(); } }
            });
        },

        // ---------------- Formatters ----------------

        _partField: function (sCode, mParts, sField) {
            return (sCode && mParts && mParts[sCode]) ? mParts[sCode][sField] : "";
        },
        fmtDescription: function (c, m) { return this._partField(c, m, "description"); },
        fmtMiyCost: function (c, m) { return this._partField(c, m, "miyCost"); },
        fmtMiyMarkup: function (c, m) { return this._partField(c, m, "miyMarkup"); },
        fmtPriceIndicator: function (c, m) { return this._partField(c, m, "priceIndicator"); },

        // ---------------- Amount calculation ----------------

        _fmtAmount: function (fValue) {
            return NumberFormat.getFloatInstance({
                minFractionDigits: 2,
                maxFractionDigits: 2
            }).format(fValue);
        },

        // Decimals arrive from OData V4 as strings, so parse them
        _unit: function (sCode, mParts) {
            const oPart = (sCode && mParts) ? mParts[sCode] : null;
            if (!oPart) { return 0; }
            return (parseFloat(oPart.miyCost) || 0) + (parseFloat(oPart.miyMarkup) || 0);
        },

        _lineTotal: function (sCode, iQty, mParts) {
            return this._unit(sCode, mParts) * (Number(iQty) || 0);
        },

        fmtUnitPrice: function (sCode, mParts) {
            return this._fmtAmount(this._unit(sCode, mParts));
        },

        fmtLineTotal: function (sCode, iQty, mParts) {
            return this._fmtAmount(this._lineTotal(sCode, iQty, mParts));
        },

        _recalcTotal: function () {
            const oBinding = this.byId("mtoPartsTable").getBinding("items");
            if (!oBinding) { return; }
            const mParts = this.getView().getModel("partsLookup").getData();
            let fTotal = 0;
            oBinding.getAllCurrentContexts().forEach((oCtx) => {
                if (oCtx.isInactive()) { return; }
                fTotal += this._lineTotal(
                    oCtx.getProperty("part_partCode"),
                    oCtx.getProperty("quantity"),
                    mParts
                );
            });
            this.getView().getModel("viewModel").setProperty("/grandTotal", this._fmtAmount(fTotal));
        },

        _recalcTotalLater: function () {
            // the context value can update a tick after the control event
            setTimeout(() => this._recalcTotal(), 0);
        },

        onQuantityChange: function () { this._recalcTotalLater(); },
        onTableUpdateFinished: function () { this._recalcTotal(); },

        // ---------------- Header: edit / save / cancel / delete ----------------

        onEdit: function () {
            this._loadModels(); // refresh the MTS dropdown
            this.getView().getModel("viewModel").setProperty("/editHeader", true);
        },

        onSaveHeader: async function () {
            const oModel = this.getView().getModel();
            const oContext = this.getView().getBindingContext();

            if (!oContext.getProperty("referenceMTSModel_modelCode")) {
                MessageBox.error("Please select a reference MTS model.");
                return;
            }
            // a cleared date picker returns "", but the service expects null
            if (oContext.getProperty("validFrom") === "") {
                oContext.setProperty("validFrom", null);
            }

            let sError = "";
            try {
                await oModel.submitBatch(HEADER_GROUP);
            } catch (oError) {
                console.error(oError);
                sError = oError && oError.message;
            }

            // anything still pending means the server rejected it; stay in edit mode
            if (oModel.hasPendingChanges(HEADER_GROUP)) {
                MessageBox.error(sError || "Save failed. Please check the entries and try again.");
                return;
            }

            this.getView().getModel("viewModel").setProperty("/editHeader", false);
            MessageToast.show("Configuration saved");
        },

        onCancelHeader: function () {
            this.getView().getModel().resetChanges(HEADER_GROUP);
            this.getView().getModel("viewModel").setProperty("/editHeader", false);
        },

        onDelete: function () {
            const oContext = this.getView().getBindingContext();
            if (!oContext) {
                MessageToast.show("Configuration not found");
                return;
            }
            MessageBox.confirm("Do you want to delete this MTO configuration?", {
                title: "Delete Configuration",
                onClose: async (sAction) => {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    try {
                        await oContext.delete("$auto");
                        MessageToast.show("Configuration deleted");
                        this.getOwnerComponent().getRouter().navTo(LIST_ROUTE);
                    } catch (oError) {
                        console.error(oError);
                        MessageBox.error("Failed to delete configuration");
                    }
                }
            });
        },

        // ---------------- Parts ----------------

        onAddPart: function () {
            // ID is generated by the server; the row stays inactive until a part is picked
            this.byId("mtoPartsTable").getBinding("items").create(
                { quantity: 1 },
                true,   // bSkipRefresh
                false,  // bAtEnd
                true    // bInactive
            );
        },

        onPartChange: function (oEvent) {
            const oCombo = oEvent.getSource();
            const oItem = oCombo.getSelectedItem();
            const oContext = oCombo.getBindingContext();
            if (!oItem || !oContext) { return; }
            // activates a new row; the other fields appear via the lookup model
            oContext.setProperty("part_partCode", oItem.getKey());
            this._recalcTotalLater();
        },

        onSaveParts: async function () {
            const oModel = this.getView().getModel();
            const oBinding = this.byId("mtoPartsTable").getBinding("items");

            if (!oModel.hasPendingChanges(GROUP)) {
                MessageToast.show("No changes to save");
                return;
            }

            // validate rows that will actually be sent
            const aSeen = new Set();
            for (const oCtx of oBinding.getAllCurrentContexts()) {
                if (oCtx.isInactive()) { continue; }

                const sPart = oCtx.getProperty("part_partCode");
                if (!sPart) {
                    MessageBox.error("Please select a part in every row");
                    return;
                }
                if (aSeen.has(sPart)) {
                    MessageBox.error("Part " + sPart + " is added more than once. Increase its quantity instead.");
                    return;
                }
                aSeen.add(sPart);

                if (!(Number(oCtx.getProperty("quantity")) > 0)) {
                    MessageBox.error("Quantity must be greater than 0");
                    return;
                }
            }

            try {
                await oModel.submitBatch(GROUP);
            } catch (oError) {
                console.error(oError);
            }

            // if anything is still pending, the server rejected it
            if (oModel.hasPendingChanges(GROUP)) {
                MessageBox.error("Save failed. Please check the entries and try again.");
                return;
            }

            MessageToast.show("Parts saved");
            this._recalcTotal();
        },

        onCancelParts: function () {
            this.getView().getModel().resetChanges(GROUP);
            MessageToast.show("Changes discarded");
            this._recalcTotal();
        },

        onDeletePart: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            if (!oContext) {
                MessageToast.show("Part not found");
                return;
            }

            // unsaved row: just discard it
            if (oContext.isInactive() || oContext.isTransient()) {
                oContext.delete().catch(() => { /* cancelled create */ }).finally(() => this._recalcTotal());
                return;
            }

            const sPart = oContext.getProperty("part_partCode") || "";
            MessageBox.confirm("Delete part " + sPart + " from this MTO configuration?", {
                title: "Delete Part",
                onClose: async (sAction) => {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    try {
                        // "$auto" so the delete happens now, not when Save is pressed
                        await oContext.delete("$auto");
                        MessageToast.show("Part deleted");
                        this._recalcTotal();
                    } catch (oError) {
                        console.error(oError);
                        MessageBox.error("Failed to delete part");
                    }
                }
            });
        }
    });
});