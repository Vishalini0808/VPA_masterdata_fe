sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/FilterType",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, MessageBox, Filter, FilterOperator, FilterType, JSONModel) {

    "use strict";

    // must match $$updateGroupId in the view
    const UPDATE_GROUP = "modelGroup";

    // properties the service expects as null, not "", when left empty
    const EMPTY_AS_NULL = [
        "validFrom", "ccWatt", "gstPercent", "dealerMarginPercent",
        "csdDiscountPercent", "csdGstPercent", "gemValue"
    ];

    return Controller.extend("vpamasterdata.controller.Models", {

        // =====================================================
        // INIT
        // =====================================================

        onInit: function () {
            // contexts of existing rows currently in edit mode
            this._aEditContexts = [];

            this.getView().setModel(new JSONModel({ count: 0 }), "viewModel");
            this.getView().setModel(
                new JSONModel({ modelCodes: [], descriptions: [] }),
                "filter"
            );

            this._loadFilterValues();
        },

        onNavBack: function () {
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
            this.byId("modelTable").getBinding("items").refresh();
            this._loadFilterValues();
        },

        // =====================================================
        // FILTER
        // =====================================================

        onGoFilter: function () {
            // V4 cannot filter while unsaved changes exist
            if (this.getView().getModel().hasPendingChanges(UPDATE_GROUP)) {
                MessageBox.warning("Please submit or cancel the unsaved rows before filtering.");
                return;
            }

            const aFilters = [];
            const sModelCode = this.byId("modelCodeFilter").getSelectedKey();
            const sDescription = this.byId("modelDescriptionFilter").getSelectedKey();
            const sOrderType = this.byId("orderTypeFilter").getSelectedKey();

            if (sModelCode) {
                aFilters.push(new Filter("modelCode", FilterOperator.EQ, sModelCode));
            }
            if (sDescription) {
                aFilters.push(new Filter("modelDescription", FilterOperator.EQ, sDescription));
            }
            if (sOrderType) {
                aFilters.push(new Filter("orderType", FilterOperator.EQ, sOrderType));
            }

            this.byId("modelTable").getBinding("items").filter(aFilters, FilterType.Application);

            // rows are re-rendered after filtering
            this._aEditContexts = [];
        },

        onClearFilter: function () {
            if (this.getView().getModel().hasPendingChanges(UPDATE_GROUP)) {
                MessageBox.warning("Please submit or cancel the unsaved rows before clearing filters.");
                return;
            }

            this.byId("modelCodeFilter").setSelectedKey("");
            this.byId("modelDescriptionFilter").setSelectedKey("");
            this.byId("orderTypeFilter").setSelectedKey("");

            this.byId("modelTable").getBinding("items").filter([], FilterType.Application);

            this._aEditContexts = [];
        },

        // unique values for the code and description dropdowns
        _loadFilterValues: function () {
            const oModel = this.getOwnerComponent().getModel();
            if (!oModel) { return; }

            oModel.bindList("/Models", null, null, null, {
                $select: "modelCode,modelDescription"
            })
                .requestContexts(0, 1000)
                .then(function (aContexts) {
                    const aModels = aContexts.map(function (oContext) {
                        return oContext.getObject();
                    });

                    const fnUnique = function (sField) {
                        return Array.from(new Set(
                            aModels.map(function (oModel) { return oModel[sField]; })
                                .filter(Boolean)
                        )).sort().map(function (sValue) {
                            return { key: sValue, text: sValue };
                        });
                    };

                    this.getView().getModel("filter").setData({
                        modelCodes: fnUnique("modelCode"),
                        descriptions: fnUnique("modelDescription")
                    });
                }.bind(this))
                .catch(function () {
                    MessageBox.error("Failed to load filter values.");
                });
        },

        // =====================================================
        // ADD ROW (inline)
        // =====================================================

        onAddRow: function () {
            const oBinding = this.byId("modelTable").getBinding("items");

            // create(initialData, bSkipRefresh, bAtEnd)
            oBinding.create({
                modelCode: "",
                validFrom: null,
                orderType: "MTS",
                modelDescription: "",
                engineType: "Petrol",
                ccWatt: null,
                gstPercent: null,
                dealerMarginPercent: null,
                csdDiscountPercent: null,
                csdGstPercent: null,
                gemValue: null,
                approvalStatus: "DRAFT"   // draft by default
            }, true, false);              // add at the top
        },

        // =====================================================
        // EDIT ROW (inline, existing rows)
        // =====================================================

        onEdit: function (oEvent) {
            // Button -> HBox -> ColumnListItem
            const oItem = oEvent.getSource().getParent().getParent();
            const oContext = oItem.getBindingContext();

            if (!oContext) {
                MessageBox.error("Unable to get selected model.");
                return;
            }
            if (oContext.isTransient()) { return; }                       // new rows are already editable
            if (this._aEditContexts.indexOf(oContext) !== -1) { return; } // already in edit mode

            this._aEditContexts.push(oContext);
            this._toggleEditCells(oItem, true);
        },

        // Model Code (cell 0) is the key and Approval Status (11)
        // is system controlled, so cells 1..10 become editable
        _toggleEditCells: function (oItem, bEdit) {
            const aCells = oItem.getCells();

            for (let i = 1; i <= 10; i++) {
                const aChildren = aCells[i].getItems();
                aChildren[0].setVisible(!bEdit);   // Text
                aChildren[1].setVisible(bEdit);    // Input / Select / DatePicker
            }
        },

        _exitEditMode: function () {
            const aItems = this.byId("modelTable").getItems();

            this._aEditContexts.forEach(function (oContext) {
                const oItem = aItems.find(function (oRow) {
                    return oRow.getBindingContext() === oContext;
                });
                if (oItem) { this._toggleEditCells(oItem, false); }
            }.bind(this));

            this._aEditContexts = [];
        },

        // =====================================================
        // CANCEL (footer): discard new rows and edits
        // =====================================================

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

        // =====================================================
        // SUBMIT (footer)
        // =====================================================

        onSubmit: async function () {
            const oModel = this.getView().getModel();

            const aNewContexts = this.byId("modelTable")
                .getBinding("items")
                .getAllCurrentContexts()
                .filter(function (oContext) { return oContext.isTransient(); });

            if (aNewContexts.length === 0 && this._aEditContexts.length === 0) {
                MessageToast.show("Nothing to submit.");
                return;
            }

            // ---------- validation ----------
            const bNewInvalid = aNewContexts.some(function (oContext) {
                return (
                    !(oContext.getProperty("modelCode") || "").trim() ||
                    !oContext.getProperty("orderType") ||
                    !oContext.getProperty("engineType")
                );
            });

            const bEditInvalid = this._aEditContexts.some(function (oContext) {
                return (
                    !oContext.getProperty("orderType") ||
                    !oContext.getProperty("engineType")
                );
            });

            if (bNewInvalid || bEditInvalid) {
                MessageBox.error("Model Code, Order Type and Engine Type are required.");
                return;
            }

            // duplicate Model Codes in the new rows
            const aCodes = aNewContexts.map(function (oContext) {
                return oContext.getProperty("modelCode").trim();
            });

            if (new Set(aCodes).size !== aCodes.length) {
                MessageBox.error("Duplicate Model Codes found in the new rows.");
                return;
            }

            // ---------- save ----------
            this.getView().setBusy(true);

            // DRAFT -> SUBMITTED (new rows and edited rows)
            const aSubmitContexts = aNewContexts.concat(this._aEditContexts);
            const mPrevious = new Map();

            aSubmitContexts.forEach(function (oContext) {
                // cleared inputs return "", but the service expects null
                EMPTY_AS_NULL.forEach(function (sProperty) {
                    if (oContext.getProperty(sProperty) === "") {
                        oContext.setProperty(sProperty, null);
                    }
                });

                mPrevious.set(oContext, oContext.getProperty("approvalStatus"));
                oContext.setProperty("approvalStatus", "SUBMITTED");
            });

            // put the old value back if the save fails
            const fnRevertStatus = function () {
                mPrevious.forEach(function (sOld, oContext) {
                    oContext.setProperty("approvalStatus", sOld || "DRAFT");
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
                    (oError && oError.message) || "Failed to save Models."
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

        // =====================================================
        // DELETE
        // =====================================================

        onDelete: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();

            if (!oContext) {
                MessageBox.error("Unable to get selected model.");
                return;
            }

            // new, unsaved row: just discard it
            if (oContext.isTransient()) {
                oContext.delete("$auto");
                return;
            }

            const sModelCode = oContext.getProperty("modelCode");

            MessageBox.confirm("Are you sure you want to delete model " + sModelCode + "?", {
                title: "Delete Model",

                onClose: async function (sAction) {
                    if (sAction !== MessageBox.Action.OK) { return; }

                    try {
                        // "$auto" = send immediately, do not wait for Submit
                        await oContext.delete("$auto");

                        // drop from edit list if it was there
                        this._aEditContexts = this._aEditContexts.filter(function (oCtx) {
                            return oCtx !== oContext;
                        });

                        MessageToast.show("Model deleted successfully.");
                        this._loadFilterValues();
                    }
                    catch (oError) {
                        MessageBox.error(oError.message || "Failed to delete model.");
                    }
                }.bind(this)
            });
        }
    });
});