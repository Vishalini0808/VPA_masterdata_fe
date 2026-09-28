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
    "sap/m/MessageBox"
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
    MessageBox
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

                this._oExpenseDialog.setTitle(sTitle);
                this._oExpenseDialog.open();
            },

            onCancel: function () {

                this._oExpenseDialog.close();

            },

            onSave: async function () {

                const oModel = this.getView().getModel();

                const sRegion = this._oRegionInput.getValue().trim();
                const sSlab = this._oSlabInput.getValue().trim();
                const sEngineType = this._oEngineTypeInput.getSelectedKey();

                if (!sRegion || !sSlab || !sEngineType) {
                    MessageBox.error("Please fill required fields.");
                    return;
                }

                const oPayload = {
                    region_regionCode: sRegion,
                    slab: sSlab,
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

                        Object.keys(oPayload).forEach((sProperty) => {
                            this._oEditContext.setProperty(
                                sProperty,
                                oPayload[sProperty]
                            );
                        });

                        await this._oEditContext.requestObject();

                        MessageToast.show("RTO Expense updated successfully.");

                    }

                    // CREATE
                    else {

                        const oListBinding = oModel.bindList("/RTOExpense");

                        const oContext = oListBinding.create(oPayload);

                        await oContext.created();

                        MessageToast.show("RTO Expense created successfully.");
                    }

                    this._oExpenseDialog.close();

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
            }



        }
    );
});