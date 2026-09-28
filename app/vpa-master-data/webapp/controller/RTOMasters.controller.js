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
        "vpamasterdata.controller.RTOMasters",
        {

            onNavBack: function () {
                this.getOwnerComponent()
                    .getRouter()
                    .navTo("RouteView1");
            },

            onAdd: function () {

                this._isEditMode = false;
                this._oEditContext = null;

                this._openRTODialog("Add RTO Master");
            },

            onEdit: function (oEvent) {

                const oContext =
                    oEvent.getSource().getBindingContext();

                const oData =
                    oContext.getObject();

                this._isEditMode = true;
                this._oEditContext = oContext;

                this._openRTODialog(
                    "Edit RTO Master",
                    oData
                );
            },

            _openRTODialog: function (sTitle, oData) {

                if (!this._oRTODialog) {

                    this._oRegionInput = new Input();

                    this._oValidFromInput = new DatePicker({
                        valueFormat: "yyyy-MM-dd",
                        displayFormat: "yyyy-MM-dd"
                    });

                    this._oSlabInput = new Input();

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

                    this._oCCMinInput = new Input({
                        type: "Number"
                    });

                    this._oCCMaxInput = new Input({
                        type: "Number"
                    });

                    this._oMinimumPriceInput = new Input({
                        type: "Number"
                    });

                    this._oMaximumPriceInput = new Input({
                        type: "Number"
                    });

                    this._oRTOPercentInput = new Input({
                        type: "Number"
                    });

                    this._oFlatPriceInput = new Input({
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

                            new Label({
                                text: "Region Code"
                            }),
                            this._oRegionInput,

                            new Label({
                                text: "Valid From"
                            }),
                            this._oValidFromInput,

                            new Label({
                                text: "Slab"
                            }),
                            this._oSlabInput,

                            new Label({
                                text: "Engine Type"
                            }),
                            this._oEngineTypeInput,

                            new Label({
                                text: "CC Minimum"
                            }),
                            this._oCCMinInput,

                            new Label({
                                text: "CC Maximum"
                            }),
                            this._oCCMaxInput,

                            new Label({
                                text: "Minimum Price"
                            }),
                            this._oMinimumPriceInput,

                            new Label({
                                text: "Maximum Price"
                            }),
                            this._oMaximumPriceInput,

                            new Label({
                                text: "RTO Percent"
                            }),
                            this._oRTOPercentInput,

                            new Label({
                                text: "Flat Price Value"
                            }),
                            this._oFlatPriceInput,

                            new Label({
                                text: "Approval Status"
                            }),
                            this._oApprovalStatusInput
                        ]
                    });

                    this._oRTODialog = new Dialog({
                        title: sTitle,
                        contentWidth: "600px",

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

                    this._oRTODialog.addContent(oForm);

                    this.getView().addDependent(
                        this._oRTODialog
                    );
                }

                this._oRTODialog.setTitle(sTitle);

                if (oData) {

                    // Edit mode

                    this._oRegionInput.setValue(
                        oData.region_regionCode || ""
                    );

                    this._oValidFromInput.setValue(
                        oData.validFrom || ""
                    );

                    this._oSlabInput.setValue(
                        oData.slab || ""
                    );

                    this._oEngineTypeInput.setSelectedKey(
                        oData.engineType || ""
                    );

                    this._oCCMinInput.setValue(
                        oData.ccMin ?? ""
                    );

                    this._oCCMaxInput.setValue(
                        oData.ccMax ?? ""
                    );

                    this._oMinimumPriceInput.setValue(
                        oData.minimumPrice ?? ""
                    );

                    this._oMaximumPriceInput.setValue(
                        oData.maximumPrice ?? ""
                    );

                    this._oRTOPercentInput.setValue(
                        oData.rtoPercent ?? ""
                    );

                    this._oFlatPriceInput.setValue(
                        oData.flatPriceValue ?? ""
                    );

                    this._oApprovalStatusInput.setSelectedKey(
                        oData.approvalStatus || ""
                    );

                } else {

                    // Add mode

                    this._oRegionInput.setValue("");
                    this._oValidFromInput.setValue("");
                    this._oSlabInput.setValue("");
                    this._oEngineTypeInput.setSelectedKey("");
                    this._oCCMinInput.setValue("");
                    this._oCCMaxInput.setValue("");
                    this._oMinimumPriceInput.setValue("");
                    this._oMaximumPriceInput.setValue("");
                    this._oRTOPercentInput.setValue("");
                    this._oFlatPriceInput.setValue("");
                    this._oApprovalStatusInput.setSelectedKey("DRAFT");
                }

                this._oRTODialog.open();
            },

            onCancel: function () {
                this._oRTODialog.close();
            },

            onSave: async function () {

                const oModel = this.getView().getModel();

                const sRegion =
                    this._oRegionInput.getValue().trim();

                const sValidFrom =
                    this._oValidFromInput.getValue();

                const sSlab =
                    this._oSlabInput.getValue().trim();

                const sEngineType =
                    this._oEngineTypeInput.getSelectedKey();

                if (!sRegion || !sSlab || !sEngineType) {

                    MessageBox.error(
                        "Region, Slab and Engine Type are required."
                    );

                    return;
                }

                const oPayload = {

                    region_regionCode: sRegion,

                    validFrom: sValidFrom || null,

                    slab: sSlab,

                    engineType: sEngineType,

                    ccMin: this._getNumber(
                        this._oCCMinInput
                    ),

                    ccMax: this._getNumber(
                        this._oCCMaxInput
                    ),

                    minimumPrice: this._getNumber(
                        this._oMinimumPriceInput
                    ),

                    maximumPrice: this._getNumber(
                        this._oMaximumPriceInput
                    ),

                    rtoPercent: this._getNumber(
                        this._oRTOPercentInput
                    ),

                    flatPriceValue: this._getNumber(
                        this._oFlatPriceInput
                    ),

                    approvalStatus:
                        this._oApprovalStatusInput
                            .getSelectedKey()
                };

                try {

                    const oListBinding =
                        oModel.bindList("/RTOMasters");

                    const oContext =
                        oListBinding.create(oPayload);

                    await oContext.created();

                    MessageToast.show(
                        "RTO Master created successfully"
                    );

                    this._oRTODialog.close();

                } catch (oError) {

                    console.error(oError);

                    MessageBox.error(
                        "Failed to create RTO Master."
                    );
                }
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