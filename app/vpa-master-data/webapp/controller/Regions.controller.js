sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, MessageBox, Filter, FilterOperator, JSONModel) {
    "use strict";

    // must match $$updateGroupId in the view
    const UPDATE_GROUP = "regionGroup";

    return Controller.extend("vpamasterdata.controller.Regions", {

        // =========================================================
        // INITIALIZATION
        // =========================================================

        onInit: function () {
            // contexts of existing rows currently in edit mode
            this._aEditContexts = [];

            this.getView().setModel(new JSONModel({ count: 0 }), "viewModel");
            this.getView().setModel(
                new JSONModel({ regionCodes: [], regionNames: [], rtoBasis: [] }),
                "filter"
            );

            this._loadFilterValues();
        },

        onPageNavButtonPress: function () {
            this.getOwnerComponent().getRouter().navTo("RouteView1");
        },

        onTableUpdateFinished: function (oEvent) {
            this.getView().getModel("viewModel")
                .setProperty("/count", oEvent.getParameter("total") || 0);
        },

        onRefresh: function () {
            if (this.getView().getModel().hasPendingChanges(UPDATE_GROUP)) {
                MessageBox.warning("Please submit or cancel the unsaved rows before refreshing.");
                return;
            }
            this._aEditContexts = [];
            this.byId("regionTable").getBinding("items").refresh();
            this._loadFilterValues();
        },

        // =========================================================
        // ADD ROW (inline)
        // =========================================================

        onAddRow: function () {
            const oBinding = this.byId("regionTable").getBinding("items");

            // create(initialData, bSkipRefresh, bAtEnd)
            oBinding.create({
                regionCode: "",
                regionName: "",
                rtoBasis: "",
                status: "Draft"   // draft by default
            }, true, false);      // add at the top
        },

        // =========================================================
        // EDIT ROW (inline, existing rows)
        // =========================================================

        onEdit: function (oEvent) {
            // Button -> HBox -> ColumnListItem
            const oItem = oEvent.getSource().getParent().getParent();
            const oContext = oItem.getBindingContext();

            if (!oContext) { return; }
            if (oContext.isTransient()) { return; }                       // new rows are already editable
            if (this._aEditContexts.indexOf(oContext) !== -1) { return; } // already in edit mode

            this._aEditContexts.push(oContext);
            this._toggleEditCells(oItem, true);
        },

        // Region Code (cell 0) is the key, so only
        // Region Name (1) and RTO Basis (2) become editable
        _toggleEditCells: function (oItem, bEdit) {
            const aCells = oItem.getCells();

            [1, 2].forEach(function (iIndex) {
                const aChildren = aCells[iIndex].getItems();
                aChildren[0].setVisible(!bEdit);  // Text
                aChildren[1].setVisible(bEdit);   // Input / ComboBox
            });
        },

        _exitEditMode: function () {
            const aItems = this.byId("regionTable").getItems();

            this._aEditContexts.forEach(function (oContext) {
                const oItem = aItems.find(function (oRow) {
                    return oRow.getBindingContext() === oContext;
                });
                if (oItem) { this._toggleEditCells(oItem, false); }
            }.bind(this));

            this._aEditContexts = [];
        },

        // =========================================================
        // CANCEL (footer): discard new rows and edits
        // =========================================================

        onCancel: function () {
            const oModel = this.getView().getModel();

            if (!oModel.hasPendingChanges(UPDATE_GROUP) && this._aEditContexts.length === 0) {
                MessageToast.show("Nothing to cancel.");
                return;
            }

            oModel.resetChanges(UPDATE_GROUP);
            this._exitEditMode();
            MessageToast.show("Changes discarded.");
        },

        // =========================================================
        // SUBMIT (footer)
        // =========================================================

        onSubmit: async function () {
            const oModel = this.getView().getModel();

            const aNewContexts = this.byId("regionTable")
                .getBinding("items")
                .getAllCurrentContexts()
                .filter(function (oContext) { return oContext.isTransient(); });

            if (aNewContexts.length === 0 && this._aEditContexts.length === 0) {
                MessageToast.show("Nothing to submit.");
                return;
            }

            // ---------- validation: new rows ----------
            const bNewInvalid = aNewContexts.some(function (oContext) {
                return (
                    !(oContext.getProperty("regionCode") || "").trim() ||
                    !oContext.getProperty("regionName") ||
                    !oContext.getProperty("rtoBasis")
                );
            });

            // ---------- validation: edited rows ----------
            const bEditInvalid = this._aEditContexts.some(function (oContext) {
                return (
                    !oContext.getProperty("regionName") ||
                    !oContext.getProperty("rtoBasis")
                );
            });

            if (bNewInvalid || bEditInvalid) {
                MessageBox.error("Please fill all fields before submitting.");
                return;
            }

            // ---------- duplicate region codes (new rows) ----------
            const aCodes = aNewContexts.map(function (oContext) {
                return oContext.getProperty("regionCode").trim();
            });

            if (new Set(aCodes).size !== aCodes.length) {
                MessageBox.error("Duplicate Region Codes found in the new rows.");
                return;
            }

            // ---------- save ----------
            this.getView().setBusy(true);

            // Draft -> Submitted (new rows and edited rows)
            aNewContexts.concat(this._aEditContexts).forEach(function (oContext) {
                oContext.setProperty("status", "Submitted");
            });

            // put the rows back to Draft if the save fails
            const fnRevertStatus = function () {
                aNewContexts.forEach(function (oContext) {
                    if (oContext.isTransient()) {
                        oContext.setProperty("status", "Draft");
                    }
                });
            };

            try {
                await oModel.submitBatch(UPDATE_GROUP);

                // still pending => the backend rejected the request
                if (oModel.hasPendingChanges(UPDATE_GROUP)) {
                    fnRevertStatus();
                    MessageBox.error(
                        this._getLastErrorMessage() ||
                        "Save failed. Please check the Network tab."
                    );
                    return;
                }

                this._exitEditMode();
                MessageToast.show("Saved successfully.");
                this._loadFilterValues();
            }
            catch (oError) {
                fnRevertStatus();
                MessageBox.error(
                    (oError && oError.message) || "Failed to save Regions."
                );
            }
            finally {
                this.getView().setBusy(false);
            }
        },

        // last backend error text from the message manager
        _getLastErrorMessage: function () {
            const aMessages = sap.ui.getCore()
                .getMessageManager()
                .getMessageModel()
                .getData()
                .filter(function (oMessage) {
                    return oMessage.getType() === "Error";
                });

            return aMessages.length
                ? aMessages[aMessages.length - 1].getMessage()
                : "";
        },

        // =========================================================
        // DELETE REGION
        // =========================================================

        onDelete: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();

            if (!oContext) { return; }

            // new, unsaved row: just discard it
            if (oContext.isTransient()) {
                oContext.delete("$auto");
                return;
            }

            const sRegionCode = oContext.getProperty("regionCode");

            MessageBox.confirm("Do you want to delete Region " + sRegionCode + "?", {
                title: "Delete Region",

                onClose: async function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }

                    try {
                        await oContext.delete("$auto");

                        // drop from edit list if it was there
                        this._aEditContexts = this._aEditContexts.filter(function (oCtx) {
                            return oCtx !== oContext;
                        });

                        MessageToast.show("Region deleted successfully.");
                        this._loadFilterValues();
                    }
                    catch (oError) {
                        MessageBox.error(oError.message || "Failed to delete Region.");
                    }
                }.bind(this)
            });
        },

        // =========================================================
        // FILTER
        // =========================================================

        onFilter: function () {
            // V4 cannot filter while unsaved changes exist
            if (this.getView().getModel().hasPendingChanges(UPDATE_GROUP)) {
                MessageBox.warning("Please submit or cancel the unsaved rows before filtering.");
                return;
            }

            const aFilters = [];
            const sRegionCode = this.byId("regionCodeFilter").getSelectedKey();
            const sRegionName = this.byId("regionNameFilter").getSelectedKey();
            const sRtoBasis = this.byId("rtoBasisFilter").getSelectedKey();

            if (sRegionCode) {
                aFilters.push(new Filter("regionCode", FilterOperator.EQ, sRegionCode));
            }
            if (sRegionName) {
                aFilters.push(new Filter("regionName", FilterOperator.EQ, sRegionName));
            }
            if (sRtoBasis) {
                aFilters.push(new Filter("rtoBasis", FilterOperator.EQ, sRtoBasis));
            }

            const oBinding = this.byId("regionTable").getBinding("items");
            if (oBinding) { oBinding.filter(aFilters); }

            // rows are re-rendered after filtering
            this._aEditContexts = [];
        },

        onClearFilters: function () {
            if (this.getView().getModel().hasPendingChanges(UPDATE_GROUP)) {
                MessageBox.warning("Please submit or cancel the unsaved rows before clearing filters.");
                return;
            }

            this.byId("regionCodeFilter").setSelectedKey("");
            this.byId("regionNameFilter").setSelectedKey("");
            this.byId("rtoBasisFilter").setSelectedKey("");

            const oBinding = this.byId("regionTable").getBinding("items");
            if (oBinding) { oBinding.filter([]); }

            this._aEditContexts = [];
        },

        // =========================================================
        // LOAD FILTER VALUES (unique values for the three dropdowns)
        // =========================================================

        _loadFilterValues: function () {
            const oModel = this.getOwnerComponent().getModel();
            if (!oModel) { return; }

            oModel.bindList("/Regions", null, null, null, {
                $select: "regionCode,regionName,rtoBasis"
            })
                .requestContexts(0, 1000)
                .then(function (aContexts) {
                    const aRegions = aContexts.map(function (oContext) {
                        return oContext.getObject();
                    });

                    const fnUnique = function (sField) {
                        return Array.from(new Set(
                            aRegions.map(function (oRegion) { return oRegion[sField]; })
                                .filter(Boolean)
                        )).sort().map(function (sValue) {
                            return { key: sValue, text: sValue };
                        });
                    };

                    this.getView().getModel("filter").setData({
                        regionCodes: fnUnique("regionCode"),
                        regionNames: fnUnique("regionName"),
                        rtoBasis: fnUnique("rtoBasis")
                    });
                }.bind(this))
                .catch(function () {
                    MessageBox.error("Failed to load filter values.");
                });
        }
    });
});