
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/FilterType",
    "sap/ui/core/BusyIndicator"
], function (
    Controller,
    JSONModel,
    MessageToast,
    MessageBox,
    Filter,
    FilterOperator,
    FilterType,
    BusyIndicator
) {
    "use strict";

    const LIST_ROUTE = "mtoConfigurations";
    const CREATE_ROUTE = "MTOConfigurationCreate";
    const OBJECT_ROUTE = "MTOConfigurationObject";

    return Controller.extend(
        "vpamasterdata.controller.MTOConfigurations", {

        // =========================
        // INIT
        // =========================

        onInit: function () {

            this.getView().setModel(
                new JSONModel({
                    count: 0,
                    isCreating: false
                }),
                "viewModel"
            );

            this.getView().setModel(
                new JSONModel({
                    mto: [],
                    mts: [],
                    configured: []
                }),
                "modelsList"
            );

            this.getView().setModel(
                new JSONModel({
                    rows: []
                }),
                "createHeader"
            );

            this._loadModels();

            // Refresh the list when returning from the Object Page.
            const oRoute = this.getOwnerComponent()
                .getRouter()
                .getRoute(LIST_ROUTE);

            oRoute.attachPatternMatched(
                this._onListMatched,
                this
            );
        },

        // =========================
        // ROUTE MATCHED
        // =========================

        _onListMatched: function () {

            const oViewModel = this.getView()
                .getModel("viewModel");

            oViewModel.setProperty(
                "/isCreating",
                false
            );

            this.getView()
                .getModel("createHeader")
                .setProperty("/rows", []);

            const oBinding = this.byId("mtoConfigurationsTable")
                .getBinding("items");

            if (oBinding) {
                oBinding.refresh();
            }

            this._loadModels();
        },

        // =========================
        // LOAD MODELS
        // =========================

        _loadModels: function () {

            const oModel = this.getOwnerComponent()
                .getModel();

            const fnRead = (sPath, mParams, aFilters) => {

                return oModel.bindList(
                    sPath,
                    null,
                    null,
                    aFilters || [],
                    mParams
                )
                    .requestContexts(0, 5000)
                    .then(aContexts => {

                        return aContexts.map(oContext => ({
                            ...oContext.getObject()
                        }));

                    });
            };

            const mModelParams = {
                $select:
                    "modelCode,modelDescription,orderType,approvalStatus",

                $orderby: "modelCode"
            };

            return Promise.all([

                // Approved MTO models
                fnRead(
                    "/Models",
                    mModelParams,
                    [
                        new Filter(
                            "orderType",
                            FilterOperator.EQ,
                            "MTO"
                        ),
                        new Filter(
                            "approvalStatus",
                            FilterOperator.EQ,
                            "APPROVED"
                        )
                    ]
                ),

                // Reference MTS models
                fnRead(
                    "/Models",
                    mModelParams,
                    [
                        new Filter(
                            "orderType",
                            FilterOperator.EQ,
                            "MTS"
                        )
                    ]
                ),

                // Already configured MTO models
                fnRead(
                    "/MTOConfigurations",
                    {
                        $select: "mtoModelCode"
                    },
                    []
                )

            ]).then(([aMto, aMts, aConfigs]) => {

                const oUsed = new Set(
                    aConfigs.map(oConfig =>
                        oConfig.mtoModelCode
                    )
                );

                // Only MTO models without configurations
                const aAvailableMto = aMto.filter(
                    oMto => !oUsed.has(oMto.modelCode)
                );

                const aConfigured = aConfigs.map(
                    oConfig => ({
                        modelCode: oConfig.mtoModelCode
                    })
                );

                this.getView()
                    .getModel("modelsList")
                    .setData({

                        mto: aAvailableMto,

                        mts: aMts,

                        configured: aConfigured

                    });

                console.log(
                    "Available MTO:",
                    aAvailableMto.length,
                    "MTS:",
                    aMts.length,
                    "Configured:",
                    aConfigured.length
                );

            }).catch(oError => {

                console.error(
                    "Loading MTO configuration models failed:",
                    oError
                );

                MessageBox.error(
                    "Unable to load model details. Please refresh."
                );

            });
        },

        // =========================
        // CREATE MODE HELPERS
        // =========================

        _isCreating: function () {

            return this.getView()
                .getModel("viewModel")
                .getProperty("/isCreating");
        },

        _clearCreateHeader: function () {

            this.getView()
                .getModel("createHeader")
                .setProperty("/rows", []);

            this.getView()
                .getModel("viewModel")
                .setProperty("/isCreating", false);
        },

        _hasCreateData: function () {

            const aRows = this.getView()
                .getModel("createHeader")
                .getProperty("/rows") || [];

            if (!aRows.length) {
                return false;
            }

            const oHeader = aRows[0];

            return !!(
                oHeader.mtoModelCode ||
                oHeader.referenceMTSModel_modelCode ||
                oHeader.validFrom
            );
        },

        // =========================
        // BACK NAVIGATION
        // =========================

        onNavBack: function () {

            if (!this._isCreating()) {

                this.getOwnerComponent()
                    .getRouter()
                    .navTo("RouteView1");

                return;
            }

            // New row exists but nothing has been entered
            if (!this._hasCreateData()) {

                this._clearCreateHeader();

                this.getOwnerComponent()
                    .getRouter()
                    .navTo("RouteView1");

                return;
            }

            MessageBox.confirm(
                "You have an unfinished MTO configuration. Discard it?",
                {
                    title: "Discard Configuration",

                    onClose: sAction => {

                        if (sAction !== MessageBox.Action.OK) {
                            return;
                        }

                        this._clearCreateHeader();

                        this.getOwnerComponent()
                            .getRouter()
                            .navTo("RouteView1");
                    }
                }
            );
        },

        // =========================
        // ADD NEW CONFIGURATION
        // =========================

        onAdd: function () {

            if (this._isCreating()) {

                MessageToast.show(
                    "Please complete or cancel the current configuration."
                );

                return;
            }

            const oCreateHeader = this.getView()
                .getModel("createHeader");

            // One temporary JSON row
            oCreateHeader.setProperty(
                "/rows",
                [
                    {
                        mtoModelCode: "",
                        referenceMTSModel_modelCode: "",
                        validFrom: "",
                        approvalStatus: "DRAFT"
                    }
                ]
            );

            this.getView()
                .getModel("viewModel")
                .setProperty("/isCreating", true);

            // Refresh dropdown options
            this._loadModels();
        },

        // =========================
        // NEW CONFIGURATION NAVIGATION
        // =========================

        onCreateConfigurationPress: function () {

            const oCreateHeader = this.getView()
                .getModel("createHeader");

            const aRows =
                oCreateHeader.getProperty("/rows") || [];

            if (!aRows.length) {

                MessageBox.error(
                    "New configuration header not found."
                );

                return;
            }

            const oHeader = {
                ...aRows[0]
            };

            // MTO MODEL VALIDATION
            if (!oHeader.mtoModelCode) {

                MessageBox.warning(
                    "Please select an MTO Model."
                );

                return;
            }

            // REFERENCE MTS VALIDATION
            if (!oHeader.referenceMTSModel_modelCode) {

                MessageBox.warning(
                    "Please select a Reference MTS Model."
                );

                return;
            }

            // VALID FROM VALIDATION
            if (!oHeader.validFrom) {

                MessageBox.warning(
                    "Please select Valid From."
                );

                return;
            }

            // Check whether selected MTO is available
            const aAvailableMto = this.getView()
                .getModel("modelsList")
                .getProperty("/mto") || [];

            const bAvailable = aAvailableMto.some(
                oModel =>
                    oModel.modelCode === oHeader.mtoModelCode
            );

            if (!bAvailable) {

                MessageBox.error(
                    "The selected MTO Model is already configured or is not available."
                );

                return;
            }

            // Final temporary header
            const oFinalHeader = {

                mtoModelCode:
                    oHeader.mtoModelCode,

                referenceMTSModel_modelCode:
                    oHeader.referenceMTSModel_modelCode,

                validFrom:
                    oHeader.validFrom,

                approvalStatus: "DRAFT"
            };

            // Store header and empty parts on component
            const oCreateModel = new JSONModel({

                header: oFinalHeader,

                parts: []

            });

            this.getOwnerComponent()
                .setModel(
                    oCreateModel,
                    "mtoCreateModel"
                );

            // Clear temporary List Page row
            this._clearCreateHeader();

            // Show Busy Indicator
            BusyIndicator.show(0);

            // Navigate to Object Page Create Mode
            this.getOwnerComponent()
                .getRouter()
                .navTo(CREATE_ROUTE);
        },

        // =========================
        // CANCEL NEW CONFIGURATION
        // =========================

        onCancelCreate: function () {

            if (!this._isCreating()) {
                return;
            }

            if (!this._hasCreateData()) {

                this._clearCreateHeader();

                return;
            }

            MessageBox.confirm(
                "Discard this new MTO configuration?",
                {
                    title: "Cancel Configuration",

                    onClose: sAction => {

                        if (sAction !== MessageBox.Action.OK) {
                            return;
                        }

                        this._clearCreateHeader();

                        MessageToast.show(
                            "New configuration discarded."
                        );
                    }
                }
            );
        },

        // =========================
        // EXISTING CONFIGURATION NAVIGATION
        // =========================

        onConfigurationPress: function (oEvent) {

            if (this._isCreating()) {

                MessageToast.show(
                    "Please complete or cancel the new configuration first."
                );

                return;
            }

            const oContext = oEvent.getSource()
                .getBindingContext();

            if (!oContext) {
                return;
            }

            const sMtoModelCode = oContext.getProperty(
                "mtoModelCode"
            );

            if (!sMtoModelCode) {

                MessageBox.error(
                    "MTO Model Code not found."
                );

                return;
            }
            // Show Busy Indicator immediately
            BusyIndicator.show(0);
            this.getOwnerComponent()
                .getRouter()
                .navTo(
                    OBJECT_ROUTE,
                    {
                        mtoModelCode:
                            encodeURIComponent(sMtoModelCode)
                    }
                );
        },

        // =========================
        // FILTER
        // =========================

        onFilter: function () {

            if (this._isCreating()) {

                MessageToast.show(
                    "Please complete or cancel the new configuration first."
                );

                return;
            }

            const aFilters = [];

            const sMTOModelCode = this.byId(
                "mtoModelCodeFilter"
            ).getSelectedKey();

            const sReferenceMTS = this.byId(
                "mtoReferenceMTSFilter"
            ).getSelectedKey();

            const sValidFrom = this.byId(
                "mtoValidFromFilter"
            ).getValue();

            if (sMTOModelCode) {

                aFilters.push(
                    new Filter(
                        "mtoModelCode",
                        FilterOperator.EQ,
                        sMTOModelCode
                    )
                );
            }

            if (sReferenceMTS) {

                aFilters.push(
                    new Filter(
                        "referenceMTSModel_modelCode",
                        FilterOperator.EQ,
                        sReferenceMTS
                    )
                );
            }

            if (sValidFrom) {

                aFilters.push(
                    new Filter(
                        "validFrom",
                        FilterOperator.EQ,
                        sValidFrom
                    )
                );
            }

            this.byId("mtoConfigurationsTable")
                .getBinding("items")
                .filter(
                    aFilters,
                    FilterType.Application
                );
        },

        // =========================
        // CLEAR FILTERS
        // =========================

        onClearFilters: function () {

            if (this._isCreating()) {

                MessageToast.show(
                    "Please complete or cancel the new configuration first."
                );

                return;
            }

            this.byId("mtoModelCodeFilter")
                .setSelectedKey("");

            this.byId("mtoReferenceMTSFilter")
                .setSelectedKey("");

            this.byId("mtoValidFromFilter")
                .setValue("");

            this.byId("mtoConfigurationsTable")
                .getBinding("items")
                .filter([], FilterType.Application);
        },

        // =========================
        // REFRESH
        // =========================

        onRefresh: function () {

            if (this._isCreating()) {

                MessageToast.show(
                    "Please complete or cancel the new configuration first."
                );

                return;
            }

            const oBinding = this.byId(
                "mtoConfigurationsTable"
            ).getBinding("items");

            if (oBinding) {
                oBinding.refresh();
            }

            this._loadModels();

            MessageToast.show(
                "MTO configurations refreshed."
            );
        },

        // =========================
        // TABLE COUNT
        // =========================

        onTableUpdateFinished: function (oEvent) {

            const iTotal =
                oEvent.getParameter("total") || 0;

            this.getView()
                .getModel("viewModel")
                .setProperty(
                    "/count",
                    iTotal
                );
        }

    });
});
