sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/FilterType"
], function (Controller, JSONModel, MessageToast, MessageBox, Filter, FilterOperator, FilterType) {

    "use strict";

    const GROUP = "mtoGroup"; // deferred group: nothing is sent until Save is pressed

    return Controller.extend("vpamasterdata.controller.MTOConfigurations", {

        // =========================
        // INIT
        // =========================

        onInit: function () {
            this.getView().setModel(new JSONModel({ editKey: "", count: 0 }), "viewModel");
            this.getView().setModel(new JSONModel({ mto: [], mts: [], configured: [] }), "modelsList");
            this._loadModels();
        },

        // Dropdown data: MTO models without a configuration yet, all MTS models,
        // and the codes that already have a configuration (for the filter bar)
        _loadModels: function () {
            const oModel = this.getOwnerComponent().getModel();

            const fnRead = (sPath, mParams, aFilters) =>
                oModel.bindList(sPath, null, null, aFilters, mParams)
                    .requestContexts(0, 5000)
                    .then((aCtx) => aCtx.map((oCtx) => ({ ...oCtx.getObject() })));

            const mModelParams = {
                $select: "modelCode,modelDescription,orderType",
                $orderby: "modelCode"
            };

            return Promise.all([
                fnRead("/Models", mModelParams, [new Filter("orderType", FilterOperator.EQ, "MTO")]),
                fnRead("/Models", mModelParams, [new Filter("orderType", FilterOperator.EQ, "MTS")]),
                fnRead("/MTOConfigurations", { $select: "mtoModelCode" })
            ]).then(([aMto, aMts, aConfigs]) => {
                const oUsed = new Set(aConfigs.map((o) => o.mtoModelCode));
                this.getView().getModel("modelsList").setData({
                    mto: aMto.filter((o) => !oUsed.has(o.modelCode)),
                    mts: aMts,
                    configured: aConfigs.map((o) => ({ modelCode: o.mtoModelCode }))
                });
            }).catch((oError) => console.error("Loading models failed", oError));
        },

        _isEditing: function () {
            const oViewModel = this.getView().getModel("viewModel");
            return !!oViewModel.getProperty("/editKey") ||
                this.getView().getModel().hasPendingChanges(GROUP);
        },

        _warnEditing: function () {
            MessageToast.show("Save or cancel the row you are editing first.");
        },

        // =========================
        // NAVIGATION
        // =========================

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteView1");
        },

        onConfigurationPress: function (oEvent) {
            if (this._isEditing()) { this._warnEditing(); return; }

            const sMTOModelCode = oEvent.getSource().getBindingContext().getProperty("mtoModelCode");

            this.getOwnerComponent().getRouter().navTo("MTOConfigurationObject", {
                mtoModelCode: encodeURIComponent(sMTOModelCode)
            });
        },

        // =========================
        // FILTER / REFRESH
        // =========================

        onFilter: function () {
            if (this._isEditing()) { this._warnEditing(); return; }

            const aFilters = [];
            const sMTOModelCode = this.byId("mtoModelCodeFilter").getSelectedKey();
            const sReferenceMTS = this.byId("mtoReferenceMTSFilter").getSelectedKey();
            const sValidFrom = this.byId("mtoValidFromFilter").getValue();

            if (sMTOModelCode) {
                aFilters.push(new Filter("mtoModelCode", FilterOperator.EQ, sMTOModelCode));
            }
            if (sReferenceMTS) {
                aFilters.push(new Filter("referenceMTSModel_modelCode", FilterOperator.EQ, sReferenceMTS));
            }
            if (sValidFrom) {
                aFilters.push(new Filter("validFrom", FilterOperator.EQ, sValidFrom));
            }

            const oBinding = this.byId("mtoConfigurationsTable").getBinding("items");
            if (oBinding) {
                oBinding.filter(aFilters, FilterType.Application);
            }
        },

        onClearFilters: function () {
            if (this._isEditing()) { this._warnEditing(); return; }

            this.byId("mtoModelCodeFilter").setSelectedKey("");
            this.byId("mtoReferenceMTSFilter").setSelectedKey("");
            this.byId("mtoValidFromFilter").setValue("");

            const oBinding = this.byId("mtoConfigurationsTable").getBinding("items");
            if (oBinding) {
                oBinding.filter([]);
            }
        },

        onRefresh: function () {
            if (this._isEditing()) { this._warnEditing(); return; }

            this.byId("mtoConfigurationsTable").getBinding("items").refresh();
            this._loadModels();
        },

        onTableUpdateFinished: function (oEvent) {
            this.getView().getModel("viewModel")
                .setProperty("/count", oEvent.getParameter("total") || 0);
        },

        // =========================
        // ADD ROW (inline)
        // =========================

        onAdd: function () {
            if (this._isEditing()) { this._warnEditing(); return; }

            this._loadModels(); // refresh dropdowns

            const oBinding = this.byId("mtoConfigurationsTable").getBinding("items");

            // new row appears at the top in edit mode (a created row is "transient")
            const oContext = oBinding.create({ validFrom: null }, true, false, false);
            oContext.created().catch(() => { /* rejected when the row is cancelled */ });
        },

        onEditRow: function (oEvent) {
            if (this._isEditing()) { this._warnEditing(); return; }

            this._loadModels(); // refresh dropdowns

            const oButton = oEvent.getSource();
            const oContext = oButton.getBindingContext();
            const oItem = oButton.getParent().getParent(); // Button -> HBox -> ColumnListItem

            this.getView().getModel("viewModel")
                .setProperty("/editKey", oContext.getProperty("mtoModelCode"));
            this._setRowEdit(oItem, true);
        },

        onSaveRow: async function (oEvent) {
            const oButton = oEvent.getSource();
            const oContext = oButton.getBindingContext();
            const oItem = oButton.getParent().getParent();
            const oModel = this.getView().getModel();
            const bNew = oContext.isTransient();

            if (!oContext.getProperty("mtoModelCode")) {
                MessageBox.error("Please select an MTO model.");
                return;
            }
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
                await oModel.submitBatch(GROUP);
            } catch (oError) {
                console.error(oError);
                sError = oError && oError.message;
            }

            // anything still pending means the server rejected it; the row stays in edit mode
            if (oModel.hasPendingChanges(GROUP)) {
                MessageBox.error(sError || "Save failed. Please check the entries and try again.");
                return;
            }

            if (!bNew) { this._setRowEdit(oItem, false); }
            this.getView().getModel("viewModel").setProperty("/editKey", "");
            MessageToast.show("MTO Configuration saved.");
            this._loadModels(); // the used MTO code must disappear from the dropdown
        },

        onCancelRow: function (oEvent) {
            const oButton = oEvent.getSource();
            const oContext = oButton.getBindingContext();
            const oItem = oButton.getParent().getParent();
            const bNew = oContext.isTransient();

            // resets edits of an existing row and removes a new unsaved row
            this.getView().getModel().resetChanges(GROUP);

            if (!bNew) { this._setRowEdit(oItem, false); }
            this.getView().getModel("viewModel").setProperty("/editKey", "");
        },


        // =========================
        // DELETE
        // =========================

        onDelete: function (oEvent) {
            if (this._isEditing()) { this._warnEditing(); return; }

            const oContext = oEvent.getSource().getBindingContext();

            MessageBox.confirm("Are you sure you want to delete this MTO Configuration?", {
                title: "Confirm Delete",
                onClose: async (sAction) => {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    try {
                        // "$auto": delete right away, not on the deferred Save group
                        await oContext.delete("$auto");
                        MessageToast.show("MTO Configuration deleted successfully.");
                        this._loadModels(); // the MTO code is selectable again
                    } catch (oError) {
                        console.error(oError);
                        MessageBox.error(oError.message || "Delete failed.");
                    }
                }
            });
        },
        // Switches an EXISTING row between display and edit mode.
        // (A new row switches automatically because it is transient.)
        _setRowEdit: function (oItem, bEdit) {
            if (!oItem || !oItem.getCells) { return; }
            const aCells = oItem.getCells();

            [1, 2].forEach((i) => {
                const aItems = aCells[i].getItems(); // [Text, editor]
                aItems[0].setVisible(!bEdit);
                aItems[1].setVisible(bEdit);
            });

            const aBtns = aCells[3].getItems(); // [Edit, Delete, Save, Cancel]
            aBtns[0].setVisible(!bEdit);
            aBtns[1].setVisible(!bEdit);
            aBtns[2].setVisible(bEdit);
            aBtns[3].setVisible(bEdit);
        },
    });
});