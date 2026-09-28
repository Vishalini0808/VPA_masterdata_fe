sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/DatePicker",
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
    DatePicker,
    Select,
    Item,
    Label,
    SimpleForm,
    MessageToast,
    MessageBox
) {
    "use strict";

    return Controller.extend(
        "vpamasterdata.controller.PricingComponents",
        {

            onNavBack: function () {
                this.getOwnerComponent()
                    .getRouter()
                    .navTo("RouteView1");
            },

            onAdd: function () {

                this._isEditMode = false;
                this._oEditContext = null;

                this._openPricingDialog("Add Pricing Component");
            },

            _openPricingDialog: function (sTitle, oData) {

                if (!this._oPricingDialog) {

                    this._oRegionCodeInput = new Input();

                    this._oEngineTypeInput = new Select({
                        items: [
                            new Item({
                                key: "Petrol",
                                text: "Petrol"
                            }),
                            new Item({
                                key: "EV",
                                text: "EV"
                            })
                        ]
                    });

                    this._oValidFromInput = new DatePicker({
                        valueFormat: "yyyy-MM-dd",
                        displayFormat: "yyyy-MM-dd"
                    });

                    this._oHelmetInput = new Input({
                        type: "Number"
                    });

                    this._oTransportationInput = new Input({
                        type: "Number"
                    });

                    this._oHelmetMarginInput = new Input({
                        type: "Number"
                    });

                    this._oOtherExpensesBelow500Input = new Input({
                        type: "Number"
                    });

                    this._oOtherExpensesAbove500Input = new Input({
                        type: "Number"
                    });

                    this._oInsuranceRateBelow350Input = new Input({
                        type: "Number"
                    });

                    this._oInsuranceRateAbove350Input = new Input({
                        type: "Number"
                    });

                    this._oTpaPaBelow350Input = new Input({
                        type: "Number"
                    });

                    this._oTpaPaAbove350Input = new Input({
                        type: "Number"
                    });

                    this._oNoPlateChargesInput = new Input({
                        type: "Number"
                    });

                    this._oApprovalStatusInput = new Select({
                        items: [
                            new Item({
                                key: "DRAFT",
                                text: "DRAFT"
                            }),
                            new Item({
                                key: "SUBMITTED",
                                text: "SUBMITTED"
                            }),
                            new Item({
                                key: "APPROVED",
                                text: "APPROVED"
                            }),
                            new Item({
                                key: "REJECTED",
                                text: "REJECTED"
                            })
                        ]
                    });

                    const oForm = new SimpleForm({
                        editable: true,
                        layout: "ResponsiveGridLayout",
                        content: [

                            new Label({ text: "Region Code" }),
                            this._oRegionCodeInput,

                            new Label({ text: "Engine Type" }),
                            this._oEngineTypeInput,

                            new Label({ text: "Valid From" }),
                            this._oValidFromInput,

                            new Label({ text: "Helmet" }),
                            this._oHelmetInput,

                            new Label({ text: "Transportation" }),
                            this._oTransportationInput,

                            new Label({ text: "Helmet Margin" }),
                            this._oHelmetMarginInput,

                            new Label({ text: "Other Expenses Below 500" }),
                            this._oOtherExpensesBelow500Input,

                            new Label({ text: "Other Expenses Above 500" }),
                            this._oOtherExpensesAbove500Input,

                            new Label({ text: "Insurance Rate Below 350" }),
                            this._oInsuranceRateBelow350Input,

                            new Label({ text: "Insurance Rate Above 350" }),
                            this._oInsuranceRateAbove350Input,

                            new Label({ text: "TPA/PA Below 350" }),
                            this._oTpaPaBelow350Input,

                            new Label({ text: "TPA/PA Above 350" }),
                            this._oTpaPaAbove350Input,

                            new Label({ text: "No Plate Charges" }),
                            this._oNoPlateChargesInput,

                            new Label({ text: "Approval Status" }),
                            this._oApprovalStatusInput
                        ]
                    });

                    this._oPricingDialog = new Dialog({
                        contentWidth: "600px",
                        contentHeight: "auto",

                        buttons: [

                            new Button({
                                text: "Save",
                                type: "Emphasized",
                                press: this.onSave.bind(this)
                            }),

                            new Button({
                                text: "Cancel",
                                press: this.onCancel.bind(this)
                            })
                        ]
                    });

                    this._oPricingDialog.addContent(oForm);

                    this.getView().addDependent(this._oPricingDialog);
                }

                this._oPricingDialog.setTitle(sTitle);

                // Fill values in Edit mode
                if (oData) {

                    this._oRegionCodeInput.setValue(
                        oData.regionCode || ""
                    );

                    this._oEngineTypeInput.setSelectedKey(
                        oData.engineType || ""
                    );

                    this._oValidFromInput.setValue(
                        oData.validFrom || ""
                    );

                    this._oHelmetInput.setValue(
                        oData.helmet ?? ""
                    );

                    this._oTransportationInput.setValue(
                        oData.transportation ?? ""
                    );

                    this._oHelmetMarginInput.setValue(
                        oData.helmetMargin ?? ""
                    );

                    this._oOtherExpensesBelow500Input.setValue(
                        oData.otherExpensesBelow500 ?? ""
                    );

                    this._oOtherExpensesAbove500Input.setValue(
                        oData.otherExpensesAbove500 ?? ""
                    );

                    this._oInsuranceRateBelow350Input.setValue(
                        oData.insuranceRateBelow350 ?? ""
                    );

                    this._oInsuranceRateAbove350Input.setValue(
                        oData.insuranceRateAbove350 ?? ""
                    );

                    this._oTpaPaBelow350Input.setValue(
                        oData.tpaPaBelow350 ?? ""
                    );

                    this._oTpaPaAbove350Input.setValue(
                        oData.tpaPaAbove350 ?? ""
                    );

                    this._oNoPlateChargesInput.setValue(
                        oData.noPlateCharges ?? ""
                    );

                    this._oApprovalStatusInput.setSelectedKey(
                        oData.approvalStatus || ""
                    );

                    // Composite key should not be changed
                    this._oRegionCodeInput.setEnabled(false);
                    this._oEngineTypeInput.setEnabled(false);

                } else {

                    // Clear fields for Add
                    this._oRegionCodeInput.setValue("");
                    this._oEngineTypeInput.setSelectedKey("");
                    this._oValidFromInput.setValue("");

                    this._oHelmetInput.setValue("");
                    this._oTransportationInput.setValue("");
                    this._oHelmetMarginInput.setValue("");

                    this._oOtherExpensesBelow500Input.setValue("");
                    this._oOtherExpensesAbove500Input.setValue("");

                    this._oInsuranceRateBelow350Input.setValue("");
                    this._oInsuranceRateAbove350Input.setValue("");

                    this._oTpaPaBelow350Input.setValue("");
                    this._oTpaPaAbove350Input.setValue("");

                    this._oNoPlateChargesInput.setValue("");

                    this._oApprovalStatusInput.setSelectedKey("DRAFT");

                    this._oRegionCodeInput.setEnabled(true);
                    this._oEngineTypeInput.setEnabled(true);
                }

                this._oPricingDialog.open();
            },

            onCancel: function () {

                this._oPricingDialog.close();
            },

            onEdit: function (oEvent) {

                const oContext =
                    oEvent.getSource().getBindingContext();

                const oData =
                    oContext.getObject();

                this._isEditMode = true;
                this._oEditContext = oContext;

                this._openPricingDialog(
                    "Edit Pricing Component",
                    oData
                );
            },

            onSave: async function () {

                const oModel = this.getView().getModel();

                const sRegionCode =
                    this._oRegionCodeInput.getValue().trim();

                const sEngineType =
                    this._oEngineTypeInput.getSelectedKey();

                const sValidFrom =
                    this._oValidFromInput.getValue();

                if (!sRegionCode || !sEngineType) {

                    MessageBox.error(
                        "Region Code and Engine Type are required."
                    );

                    return;
                }

                const oPayload = {

                    validFrom: sValidFrom || null,

                    helmet: this._getNumber(
                        this._oHelmetInput
                    ),

                    transportation: this._getNumber(
                        this._oTransportationInput
                    ),

                    helmetMargin: this._getNumber(
                        this._oHelmetMarginInput
                    ),

                    otherExpensesBelow500: this._getNumber(
                        this._oOtherExpensesBelow500Input
                    ),

                    otherExpensesAbove500: this._getNumber(
                        this._oOtherExpensesAbove500Input
                    ),

                    insuranceRateBelow350: this._getNumber(
                        this._oInsuranceRateBelow350Input
                    ),

                    insuranceRateAbove350: this._getNumber(
                        this._oInsuranceRateAbove350Input
                    ),

                    tpaPaBelow350: this._getNumber(
                        this._oTpaPaBelow350Input
                    ),

                    tpaPaAbove350: this._getNumber(
                        this._oTpaPaAbove350Input
                    ),

                    noPlateCharges: this._getNumber(
                        this._oNoPlateChargesInput
                    ),

                    approvalStatus:
                        this._oApprovalStatusInput.getSelectedKey()
                };

                try {

                    if (this._isEditMode) {

                        const oContext = this._oEditContext;

                        Object.keys(oPayload).forEach((sProperty) => {
                            oContext.setProperty(
                                sProperty,
                                oPayload[sProperty]
                            );
                        });

                        await oContext.requestObject();

                        MessageToast.show(
                            "Pricing Component updated successfully"
                        );

                    } else {

                        const oListBinding =
                            oModel.bindList("/PricingComponents");

                        const oContext =
                            oListBinding.create({

                                regionCode: sRegionCode,

                                engineType: sEngineType,

                                ...oPayload
                            });

                        await oContext.created();

                        MessageToast.show(
                            "Pricing Component created successfully"
                        );
                    }

                    this._oPricingDialog.close();

                } catch (oError) {

                    console.error(oError);

                    MessageBox.error(
                        "Failed to save Pricing Component."
                    );
                }
            },

            onDelete: function (oEvent) {

                const oContext =
                    oEvent.getSource().getBindingContext();

                const sRegionCode =
                    oContext.getProperty("regionCode");

                const sEngineType =
                    oContext.getProperty("engineType");

                MessageBox.confirm(
                    `Delete ${sRegionCode} - ${sEngineType}?`,
                    {
                        title: "Confirm Delete",

                        onClose: async (sAction) => {

                            if (sAction !== MessageBox.Action.OK) {
                                return;
                            }

                            try {

                                await oContext.delete();

                                MessageToast.show(
                                    "Pricing Component deleted successfully"
                                );

                            } catch (oError) {

                                console.error(oError);

                                MessageBox.error(
                                    "Failed to delete Pricing Component."
                                );
                            }
                        }
                    }
                );
            },

            _getNumber: function (oInput) {

                const sValue = oInput.getValue();

                return sValue !== ""
                    ? Number(sValue)
                    : null;
            }
        }
    );
});