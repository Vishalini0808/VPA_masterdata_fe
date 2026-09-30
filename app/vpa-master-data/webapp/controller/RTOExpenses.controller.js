sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Select",
    "sap/ui/core/Item",
    "sap/m/Label",
    "sap/ui/layout/form/SimpleForm",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/FilterType",
    "sap/m/CheckBox",
    "sap/m/VBox"
], function (
    Controller,
    Dialog,
    Button,
    Input,
    Select,
    Item,
    Label,
    SimpleForm,
    MessageToast,
    MessageBox,
    Filter,
    FilterOperator,
    FilterType,
    CheckBox,
    VBox
) {
    "use strict";

    return Controller.extend(
        "vpamasterdata.controller.RTOExpenses",
        {

            onNavBack: function () {

                this.getOwnerComponent()
                    .getRouter()
                    .navTo("RouteView1");

            },

            // =========================================================
            // FILTER (Go)
            // =========================================================

            onFilter: function () {

                const aFilters = [];

                const sRegion =
                    this.byId("expRegionFilter").getSelectedKey();

                const sEngineType =
                    this.byId("expEngineTypeFilter").getSelectedKey();

                const sApprovalStatus =
                    this.byId("expApprovalStatusFilter").getSelectedKey();

                if (sRegion) {
                    aFilters.push(new Filter(
                        "region_regionCode", FilterOperator.EQ, sRegion));
                }

                if (sEngineType) {
                    aFilters.push(new Filter(
                        "engineType", FilterOperator.EQ, sEngineType));
                }

                if (sApprovalStatus) {
                    aFilters.push(new Filter(
                        "approvalStatus", FilterOperator.EQ, sApprovalStatus));
                }

                const oBinding =
                    this.byId("rtoExpensesTable").getBinding("items");

                if (oBinding) {
                    oBinding.filter(aFilters, FilterType.Application);
                }

                MessageToast.show(
                    aFilters.length === 0
                        ? "All filters cleared."
                        : "Filter applied."
                );
            },

            // =========================================================
            // CLEAR FILTERS
            // =========================================================

            onClearFilters: function () {

                this.byId("expRegionFilter").setSelectedKey("");
                this.byId("expEngineTypeFilter").setSelectedKey("");
                this.byId("expApprovalStatusFilter").setSelectedKey("");

                const oBinding =
                    this.byId("rtoExpensesTable").getBinding("items");

                if (oBinding) {
                    oBinding.filter([]);
                }

                MessageToast.show("Filters cleared.");
            },

            // =========================================================
            // ADAPT FILTERS (show / hide filter fields)
            // =========================================================

            onAdaptFilters: function () {

                if (this._oAdaptFilterDialog) {
                    this._oAdaptFilterDialog.open();
                    return;
                }

                const oRegionCB = new CheckBox({ text: "Region", selected: true });
                const oEngineCB = new CheckBox({ text: "Engine Type", selected: true });
                const oStatusCB = new CheckBox({ text: "Approval Status", selected: true });

                this._oAdaptFilterDialog = new Dialog({

                    title: "Adapt Filters",
                    contentWidth: "350px",

                    content: [
                        new VBox({
                            class: "sapUiMediumMargin",
                            items: [
                                new Label({ text: "Select filter fields" }),
                                oRegionCB,
                                oEngineCB,
                                oStatusCB
                            ]
                        })
                    ],

                    beginButton: new Button({
                        text: "Apply",
                        type: "Emphasized",
                        press: function () {

                            this.byId("expRegionFilter")
                                .setVisible(oRegionCB.getSelected());

                            this.byId("expEngineTypeFilter")
                                .setVisible(oEngineCB.getSelected());

                            this.byId("expApprovalStatusFilter")
                                .setVisible(oStatusCB.getSelected());

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

            onAdd: function () {

                this._isEditMode = false;
                this._oEditContext = null;

                this._openExpenseDialog(
                    "Add RTO Expense"
                );

            },

            _openExpenseDialog: function (sTitle, oData) {

                if (!this._oExpenseDialog) {

                    this._oRegionInput = new Input();
                    this._oSlabInput = new Input();

                    this._oEngineTypeInput = new Select({
                        items: [
                            new Item({ key: "Petrol", text: "Petrol" }),
                            new Item({ key: "EV", text: "EV" })
                        ]
                    });

                    this._oMinimumPriceInput = new Input();
                    this._oMaximumPriceInput = new Input();
                    this._oPercentageInput = new Input();
                    this._oFixedAmountInput = new Input();

                    this._oApprovalStatusInput = new Select({
                        items: [
                            new Item({ key: "DRAFT", text: "DRAFT" }),
                            new Item({ key: "SUBMITTED", text: "SUBMITTED" }),
                            new Item({ key: "APPROVED", text: "APPROVED" }),
                            new Item({ key: "REJECTED", text: "REJECTED" })
                        ]
                    });

                    const oForm = new SimpleForm({
                        editable: true,
                        content: [
                            new Label({ text: "Region" }),
                            this._oRegionInput,

                            new Label({ text: "Slab" }),
                            this._oSlabInput,

                            new Label({ text: "Engine Type" }),
                            this._oEngineTypeInput,

                            new Label({ text: "Minimum Price" }),
                            this._oMinimumPriceInput,

                            new Label({ text: "Maximum Price" }),
                            this._oMaximumPriceInput,

                            new Label({ text: "Percentage" }),
                            this._oPercentageInput,

                            new Label({ text: "Fixed Amount" }),
                            this._oFixedAmountInput,

                            new Label({ text: "Approval Status" }),
                            this._oApprovalStatusInput
                        ]
                    });

                    this._oExpenseDialog = new Dialog({
                        title: sTitle,
                        contentWidth: "500px",
                        content: oForm,

                        beginButton: new Button({
                            text: "Save",
                            type: "Emphasized",
                            press: this.onSave.bind(this)
                        }),

                        endButton: new Button({
                            text: "Cancel",
                            press: this.onCancel.bind(this)
                        })
                    });
                }

                // ADD mode
                if (!oData) {

                    this._oRegionInput.setValue("");
                    this._oSlabInput.setValue("");
                    this._oEngineTypeInput.setSelectedKey("Petrol");
                    this._oMinimumPriceInput.setValue("");
                    this._oMaximumPriceInput.setValue("");
                    this._oPercentageInput.setValue("");
                    this._oFixedAmountInput.setValue("");
                    this._oApprovalStatusInput.setSelectedKey("DRAFT");

                }
                // EDIT mode
                else {

                    this._oRegionInput.setValue(oData.region_regionCode || "");
                    this._oSlabInput.setValue(oData.slab || "");
                    this._oEngineTypeInput.setSelectedKey(oData.engineType || "Petrol");

                    this._oMinimumPriceInput.setValue(
                        oData.minimumPrice != null ? oData.minimumPrice : ""
                    );

                    this._oMaximumPriceInput.setValue(
                        oData.maximumPrice != null ? oData.maximumPrice : ""
                    );

                    this._oPercentageInput.setValue(
                        oData.percentage != null ? oData.percentage : ""
                    );

                    this._oFixedAmountInput.setValue(
                        oData.fixedAmount != null ? oData.fixedAmount : ""
                    );

                    this._oApprovalStatusInput.setSelectedKey(
                        oData.approvalStatus || "DRAFT"
                    );
                }

                this._oRegionInput.setEditable(!oData);

                this._oExpenseDialog.setTitle(sTitle);
                this._oExpenseDialog.open();
            },

            onCancel: function () {

                this._oExpenseDialog.close();

            },

            onSave: async function () {

                const sRegion = this._oRegionInput.getValue().trim();
                const sSlab = this._oSlabInput.getValue().trim();
                const sEngineType = this._oEngineTypeInput.getSelectedKey();

                if (!sRegion || !sSlab || !sEngineType) {
                    MessageBox.error("Please fill required fields.");
                    return;
                }

                const oPayload = {
                    region_regionCode: sRegion,
                    slab: Number(sSlab),
                    engineType: sEngineType,

                    minimumPrice: this._getNumber(
                        this._oMinimumPriceInput.getValue()
                    ),

                    maximumPrice: this._getNumber(
                        this._oMaximumPriceInput.getValue()
                    ),

                    percentage: this._getNumber(
                        this._oPercentageInput.getValue()
                    ),

                    fixedAmount: this._getNumber(
                        this._oFixedAmountInput.getValue()
                    ),

                    approvalStatus: this._oApprovalStatusInput.getSelectedKey()
                };

                try {

                    // EDIT
                    if (this._isEditMode) {

                        await Promise.all(
                            Object.keys(oPayload)
                                .filter((sKey) => sKey !== "region_regionCode")
                                .map((sKey) =>
                                    this._oEditContext.setProperty(
                                        sKey, oPayload[sKey]))
                        );

                        MessageToast.show("RTO Expense updated successfully.");

                    }

                    // CREATE
                    else {

                        const oListBinding =
                            this.byId("rtoExpensesTable").getBinding("items");

                        const oContext = oListBinding.create(oPayload);

                        await oContext.created();

                        MessageToast.show("RTO Expense created successfully.");
                    }

                    this._oExpenseDialog.close();

                    this._oEditContext = null;
                    this._isEditMode = false;

                } catch (oError) {

                    console.error(oError);
                    MessageBox.error(
                        oError.message || "Operation failed."
                    );
                }
            },



            onEdit: function (oEvent) {

                const oContext = oEvent.getSource().getBindingContext();
                const oData = oContext.getObject();

                this._isEditMode = true;
                this._oEditContext = oContext;

                this._openExpenseDialog("Edit RTO Expense", oData);
            },


            onDelete: function (oEvent) {

                const oContext = oEvent.getSource().getBindingContext();

                MessageBox.confirm(
                    "Are you sure you want to delete this RTO Expense?",
                    {
                        title: "Confirm Delete",

                        onClose: async function (sAction) {

                            if (sAction !== MessageBox.Action.OK) {
                                return;
                            }

                            try {

                                await oContext.delete();

                                MessageToast.show(
                                    "RTO Expense deleted successfully."
                                );

                            } catch (oError) {

                                console.error(oError);

                                MessageBox.error(
                                    oError.message || "Delete failed."
                                );
                            }
                        }
                    }
                );
            },



            _getNumber: function (sValue) {

                if (sValue === "" || sValue === null || sValue === undefined) {
                    return null;
                }

                return Number(sValue);
            },

            onExit: function () {

                if (this._oAdaptFilterDialog) {
                    this._oAdaptFilterDialog.destroy();
                    this._oAdaptFilterDialog = null;
                }
            }

        }
    );
});