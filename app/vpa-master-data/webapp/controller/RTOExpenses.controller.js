sap.ui.define([

    "sap/ui/core/mvc/Controller",

    "sap/m/Dialog",

    "sap/m/Button",

    "sap/m/CheckBox",

    "sap/m/Label",

    "sap/m/VBox",

    "sap/m/MessageToast",

    "sap/m/MessageBox",

    "sap/ui/model/Filter",

    "sap/ui/model/FilterOperator",

    "sap/ui/model/FilterType",

    "sap/ui/model/json/JSONModel"

], function (

    Controller, Dialog, Button, CheckBox, Label, VBox,

    MessageToast, MessageBox, Filter, FilterOperator, FilterType, JSONModel

) {
 
    "use strict";
 
    // must match $$updateGroupId in the view

    const UPDATE_GROUP = "rtoExpenseGroup";
 
    // properties the service expects as null, not "", when left empty

    const EMPTY_AS_NULL = ["minimumPrice", "maximumPrice", "percentage", "fixedAmount"];
 
    return Controller.extend("vpamasterdata.controller.RTOExpenses", {
 
        // =====================================================

        // INIT

        // =====================================================
 
        onInit: function () {

            // contexts of existing rows currently in edit mode

            this._aEditContexts = [];
 
            this.getView().setModel(new JSONModel({ count: 0 }), "viewModel");

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

            this.byId("rtoExpensesTable").getBinding("items").refresh();

        },
 
        onExit: function () {

            if (this._oAdaptFilterDialog) {

                this._oAdaptFilterDialog.destroy();

                this._oAdaptFilterDialog = null;

            }

        },
 
        // =====================================================

        // FILTER

        // =====================================================
 
        onFilter: function () {

            // V4 cannot filter while unsaved changes exist

            if (this.getView().getModel().hasPendingChanges(UPDATE_GROUP)) {

                MessageBox.warning("Please submit or cancel the unsaved rows before filtering.");

                return;

            }
 
            const aFilters = [];

            const sRegion = this.byId("expRegionFilter").getSelectedKey();

            const sEngineType = this.byId("expEngineTypeFilter").getSelectedKey();

            const sApprovalStatus = this.byId("expApprovalStatusFilter").getSelectedKey();
 
            if (sRegion) {

                aFilters.push(new Filter("region_regionCode", FilterOperator.EQ, sRegion));

            }

            if (sEngineType) {

                aFilters.push(new Filter("engineType", FilterOperator.EQ, sEngineType));

            }

            if (sApprovalStatus) {

                aFilters.push(new Filter("approvalStatus", FilterOperator.EQ, sApprovalStatus));

            }
 
            this.byId("rtoExpensesTable").getBinding("items")

                .filter(aFilters, FilterType.Application);
 
            // rows are re-rendered after filtering

            this._aEditContexts = [];

        },
 
        onClearFilters: function () {

            if (this.getView().getModel().hasPendingChanges(UPDATE_GROUP)) {

                MessageBox.warning("Please submit or cancel the unsaved rows before clearing filters.");

                return;

            }
 
            this.byId("expRegionFilter").setSelectedKey("");

            this.byId("expEngineTypeFilter").setSelectedKey("");

            this.byId("expApprovalStatusFilter").setSelectedKey("");
 
            this.byId("rtoExpensesTable").getBinding("items")

                .filter([], FilterType.Application);
 
            this._aEditContexts = [];

        },
 
        // show / hide filter fields

        onAdaptFilters: function () {

            if (this._oAdaptFilterDialog) {

                this._oAdaptFilterDialog.open();

                return;

            }
 
            const oRegionCB = new CheckBox({ text: "Region", selected: true });

            const oEngineCB = new CheckBox({ text: "Engine Type", selected: true });

            const oStatusCB = new CheckBox({ text: "Approval Status", selected: true });
 
            const oBox = new VBox({

                items: [

                    new Label({ text: "Select filter fields" }),

                    oRegionCB,

                    oEngineCB,

                    oStatusCB

                ]

            });

            oBox.addStyleClass("sapUiMediumMargin");
 
            this._oAdaptFilterDialog = new Dialog({

                title: "Adapt Filters",

                contentWidth: "350px",

                content: [oBox],
 
                beginButton: new Button({

                    text: "Apply",

                    type: "Emphasized",

                    press: function () {

                        this.byId("expRegionFilterBox").setVisible(oRegionCB.getSelected());

                        this.byId("expEngineTypeFilterBox").setVisible(oEngineCB.getSelected());

                        this.byId("expApprovalStatusFilterBox").setVisible(oStatusCB.getSelected());

                        this._oAdaptFilterDialog.close();

                    }.bind(this)

                }),
 
                endButton: new Button({

                    text: "Cancel",

                    press: function () {

                        this._oAdaptFilterDialog.close();

                    }.bind(this)

                })

            });
 
            this.getView().addDependent(this._oAdaptFilterDialog);

            this._oAdaptFilterDialog.open();

        },
 
        // =====================================================

        // ADD ROW (inline)

        // =====================================================
 
        onAddRow: function () {

            const oBinding = this.byId("rtoExpensesTable").getBinding("items");
 
            // create(initialData, bSkipRefresh, bAtEnd)

            oBinding.create({

                region_regionCode: "",

                slab: null,

                engineType: "Petrol",

                minimumPrice: null,

                maximumPrice: null,

                percentage: null,

                fixedAmount: null,

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

                MessageBox.error("Unable to get selected RTO Expense.");

                return;

            }

            if (oContext.isTransient()) { return; }                       // new rows are already editable

            if (this._aEditContexts.indexOf(oContext) !== -1) { return; } // already in edit mode
 
            this._aEditContexts.push(oContext);

            this._toggleEditCells(oItem, true);

        },
 
        // Region (cell 0) and Slab (cell 1) are the key and Approval Status (7)

        // is system controlled, so cells 2..6 become editable

        _toggleEditCells: function (oItem, bEdit) {

            const aCells = oItem.getCells();
 
            for (let i = 2; i <= 6; i++) {

                const aChildren = aCells[i].getItems();

                aChildren[0].setVisible(!bEdit);   // Text

                aChildren[1].setVisible(bEdit);    // Input / Select

            }

        },
 
        _exitEditMode: function () {

            const aItems = this.byId("rtoExpensesTable").getItems();
 
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
 
            const aNewContexts = this.byId("rtoExpensesTable")

                .getBinding("items")

                .getAllCurrentContexts()

                .filter(function (oContext) { return oContext.isTransient(); });
 
            if (aNewContexts.length === 0 && this._aEditContexts.length === 0) {

                MessageToast.show("Nothing to submit.");

                return;

            }
 
            // ---------- validation ----------

            const fnEmpty = function (vValue) {

                return vValue === null || vValue === undefined || vValue === "";

            };
 
            const bNewInvalid = aNewContexts.some(function (oContext) {

                return (

                    !(oContext.getProperty("region_regionCode") || "").trim() ||

                    fnEmpty(oContext.getProperty("slab")) ||

                    !oContext.getProperty("engineType")

                );

            });
 
            const bEditInvalid = this._aEditContexts.some(function (oContext) {

                return !oContext.getProperty("engineType");

            });
 
            if (bNewInvalid || bEditInvalid) {

                MessageBox.error("Region, Slab and Engine Type are required.");

                return;

            }
 
            // duplicate Region + Slab in the new rows

            const aKeys = aNewContexts.map(function (oContext) {

                return oContext.getProperty("region_regionCode").trim() + "|" +

                    oContext.getProperty("slab");

            });
 
            if (new Set(aKeys).size !== aKeys.length) {

                MessageBox.error("Duplicate Region / Slab combinations found in the new rows.");

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

            }

            catch (oError) {

                fnRevertStatus();

                MessageBox.error(

                    (oError && oError.message) || "Failed to save RTO Expenses."

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

                MessageBox.error("Unable to get selected RTO Expense.");

                return;

            }
 
            // new, unsaved row: just discard it

            if (oContext.isTransient()) {

                oContext.delete("$auto");

                return;

            }
 
            const sLabel = oContext.getProperty("region_regionCode") + ", slab " +

                oContext.getProperty("slab");
 
            MessageBox.confirm("Are you sure you want to delete RTO Expense (" + sLabel + ")?", {

                title: "Delete RTO Expense",
 
                onClose: async function (sAction) {

                    if (sAction !== MessageBox.Action.OK) { return; }
 
                    try {

                        // "$auto" = send immediately, do not wait for Submit

                        await oContext.delete("$auto");
 
                        // drop from edit list if it was there

                        this._aEditContexts = this._aEditContexts.filter(function (oCtx) {

                            return oCtx !== oContext;

                        });
 
                        MessageToast.show("RTO Expense deleted successfully.");

                    }

                    catch (oError) {

                        MessageBox.error(oError.message || "Failed to delete RTO Expense.");

                    }

                }.bind(this)

            });

        }

    });

});
 