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

    const GROUP = "mtoGroup";          // must match $$updateGroupId in the view
    const EDITABLE_CELLS = [1, 2];     // Valid From, Reference MTS (code is the key)
    const STATUS = { DRAFT: "DRAFT", SUBMITTED: "SUBMITTED" };

    return Controller.extend("vpamasterdata.controller.MTOConfigurations", {

        // =========================
        // INIT
        // =========================

        onInit: function () {
            this._aEditContexts = []; // existing rows currently in edit mode
            this.getView().setModel(new JSONModel({ count: 0 }), "viewModel");
            this.getView().setModel(new JSONModel({ mto: [], mts: [], configured: [] }), "modelsList");
            this._loadModels();
        },

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

                console.log("MTO:", aMto.length, "MTS:", aMts.length, "Used:", oUsed.size,
            "Dropdown:", this.getView().getModel("modelsList").getData().mto.length);
            
            }).catch((oError) => console.error("Loading models failed", oError));
        },

        _isEditing: function () {
            return this._aEditContexts.length > 0 ||
                this.getView().getModel().hasPendingChanges(GROUP);
        },

        _warnEditing: function () {
            MessageToast.show("Submit or cancel your unsaved changes first.");
        },

        // =========================
        // NAVIGATION
        // =========================

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteView1");
        },

        onConfigurationPress: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            if (oContext.isTransient()) { return; }
            if (this._isEditing()) { this._warnEditing(); return; }

            this.getOwnerComponent().getRouter().navTo("MTOConfigurationObject", {
                mtoModelCode: encodeURIComponent(oContext.getProperty("mtoModelCode"))
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

            this.byId("mtoConfigurationsTable").getBinding("items")
                .filter(aFilters, FilterType.Application);
        },

        onClearFilters: function () {
            if (this._isEditing()) { this._warnEditing(); return; }

            this.byId("mtoModelCodeFilter").setSelectedKey("");
            this.byId("mtoReferenceMTSFilter").setSelectedKey("");
            this.byId("mtoValidFromFilter").setValue("");

            this.byId("mtoConfigurationsTable").getBinding("items").filter([]);
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
        // ADD / EDIT (inline, several rows at once)
        // =========================

        onAdd: function () {
            this._loadModels();

            const oBinding = this.byId("mtoConfigurationsTable").getBinding("items");

            // new row at the top, in edit mode (created rows are "transient"), starts as DRAFT
            const oContext = oBinding.create(
                { validFrom: null, approvalStatus: STATUS.DRAFT }, true, false, false);
            oContext.created().catch(() => { /* rejected when the row is cancelled */ });
        },

        onEditRow: function (oEvent) {
            const oItem = oEvent.getSource().getParent().getParent(); // Button -> HBox -> ColumnListItem
            const oContext = oItem.getBindingContext();

            if (!oContext || oContext.isTransient()) { return; }

            if (oContext.getProperty("approvalStatus") === STATUS.SUBMITTED) {
                MessageToast.show("This configuration is waiting for approval and cannot be edited.");
                return;
            }
            if (this._aEditContexts.indexOf(oContext) !== -1) { return; }

            this._loadModels();
            this._aEditContexts.push(oContext);
            this._toggleEditCells(oItem, true);
        },

        _toggleEditCells: function (oItem, bEdit) {
            const aCells = oItem.getCells();
            EDITABLE_CELLS.forEach((i) => {
                const aItems = aCells[i].getItems(); // [Text, editor]
                aItems[0].setVisible(!bEdit);
                aItems[1].setVisible(bEdit);
            });
        },

        _exitEditMode: function () {
            const aItems = this.byId("mtoConfigurationsTable").getItems();
            this._aEditContexts.forEach((oContext) => {
                const oItem = aItems.find((oRow) => oRow.getBindingContext() === oContext);
                if (oItem) { this._toggleEditCells(oItem, false); }
            });
            this._aEditContexts = [];
        },

        // =========================
        // CANCEL (footer)
        // =========================

        onCancel: function () {
            const oModel = this.getView().getModel();

            if (!oModel.hasPendingChanges(GROUP) && this._aEditContexts.length === 0) {
                MessageToast.show("Nothing to cancel.");
                return;
            }

            // discards edits of existing rows and removes new unsaved rows
            oModel.resetChanges(GROUP);
            this._exitEditMode();
            MessageToast.show("Changes discarded.");
        },

        // =========================
        // SUBMIT (footer)
        // =========================

        onSubmit: async function () {
            const oModel = this.getView().getModel();

            const aNew = this.byId("mtoConfigurationsTable").getBinding("items")
                .getAllCurrentContexts()
                .filter((oCtx) => oCtx.isTransient());

            if (aNew.length === 0 && this._aEditContexts.length === 0) {
                MessageToast.show("Nothing to submit.");
                return;
            }

            // ---------- validation ----------
            if (aNew.some((oCtx) => !oCtx.getProperty("mtoModelCode"))) {
                MessageBox.error("Please select an MTO model for every new row.");
                return;
            }
            if (aNew.concat(this._aEditContexts)
                    .some((oCtx) => !oCtx.getProperty("referenceMTSModel_modelCode"))) {
                MessageBox.error("Please select a reference MTS model for every row.");
                return;
            }
            const aCodes = aNew.map((oCtx) => oCtx.getProperty("mtoModelCode"));
            if (new Set(aCodes).size !== aCodes.length) {
                MessageBox.error("The same MTO model is selected in more than one new row.");
                return;
            }

            // ---------- status + cleanup ----------
            // remember the old status so it can be restored if the save fails
            const mOldStatus = new Map();

            aNew.forEach((oCtx) => {
                mOldStatus.set(oCtx, STATUS.DRAFT);
                oCtx.setProperty("approvalStatus", STATUS.SUBMITTED);
            });
            this._aEditContexts.forEach((oCtx) => {
                // existing rows only go back to approval if something actually changed
                if (oCtx.hasPendingChanges()) {
                    mOldStatus.set(oCtx, oCtx.getProperty("approvalStatus"));
                    oCtx.setProperty("approvalStatus", STATUS.SUBMITTED);
                }
            });

            // a cleared date picker returns "", but the service expects null
            aNew.concat(this._aEditContexts).forEach((oCtx) => {
                if (oCtx.getProperty("validFrom") === "") {
                    oCtx.setProperty("validFrom", null);
                }
            });

            // ---------- save ----------
            const fnRestoreStatus = () => mOldStatus.forEach((sOld, oCtx) => {
                oCtx.setProperty("approvalStatus", sOld);
            });

            this.getView().setBusy(true);
            try {
                await oModel.submitBatch(GROUP);

                if (oModel.hasPendingChanges(GROUP)) { // server rejected it
                    fnRestoreStatus();
                    MessageBox.error("Submit failed. Please check the entries and try again.");
                    return;
                }

                this._exitEditMode();
                MessageToast.show("Submitted for approval.");
                this._loadModels(); // used MTO codes must disappear from the dropdown
            } catch (oError) {
                console.error(oError);
                fnRestoreStatus();
                MessageBox.error((oError && oError.message) || "Failed to submit.");
            } finally {
                this.getView().setBusy(false);
            }
        },

        // =========================
        // DELETE
        // =========================

        onDelete: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();

            // new, unsaved row: just discard it
            if (oContext.isTransient()) {
                oContext.delete("$auto");
                return;
            }

            if (oContext.getProperty("approvalStatus") === STATUS.SUBMITTED) {
                MessageToast.show("This configuration is waiting for approval and cannot be deleted.");
                return;
            }

            MessageBox.confirm("Are you sure you want to delete this MTO Configuration?", {
                title: "Confirm Delete",
                onClose: async (sAction) => {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    try {
                        await oContext.delete("$auto"); // immediate, not part of the Submit batch
                        this._aEditContexts = this._aEditContexts.filter((o) => o !== oContext);
                        MessageToast.show("MTO Configuration deleted successfully.");
                        this._loadModels();
                    } catch (oError) {
                        console.error(oError);
                        MessageBox.error(oError.message || "Delete failed.");
                    }
                }
            });
        }
    });
});