sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/layout/form/SimpleForm",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/Select",
    "sap/m/DatePicker",
    "sap/ui/core/Item",
    "sap/m/Dialog",
    "sap/m/Button"
], function (
    Controller,
    MessageToast,
    MessageBox,
    SimpleForm,
    Label,
    Input,
    Select,
    DatePicker,
    Item,
    Dialog,
    Button
) {

    "use strict";

    return Controller.extend(
        "vpamasterdata.controller.Models",
        {

            // =====================================================
            // NAVIGATION
            // =====================================================

            onNavBack: function () {

                this.getOwnerComponent()
                    .getRouter()
                    .navTo("RouteView1");

            },


            // =====================================================
            // ADD MODEL
            // =====================================================

            onAdd: function () {

                this._isEditMode = false;
                this._oEditContext = null;

                this._openModelDialog("Add Model");

                this._oModelCodeInput.setEnabled(true);

                this._oModelCodeInput.setValue("");
                this._oValidFromInput.setValue("");
                this._oOrderTypeInput.setSelectedKey("MTS");
                this._oDescriptionInput.setValue("");
                this._oEngineTypeInput.setSelectedKey("Petrol");

                this._oCCWattInput.setValue("");
                this._oGSTInput.setValue("");
                this._oDealerMarginInput.setValue("");
                this._oCsdDiscountInput.setValue("");
                this._oCsdGstInput.setValue("");
                this._oGemValueInput.setValue("");

                this._oStatusInput.setSelectedKey("ACTIVE");
                this._oApprovalStatusInput.setSelectedKey("DRAFT");
            },


            // =====================================================
            // EDIT MODEL
            // =====================================================

            onEdit: function (oEvent) {

                const oContext =
                    oEvent.getSource().getBindingContext();

                if (!oContext) {
                    MessageBox.error("Unable to get selected model.");
                    return;
                }

                this._isEditMode = true;
                this._oEditContext = oContext;

                const oData = oContext.getObject();

                this._openModelDialog("Edit Model", oData);

                this._oModelCodeInput.setEnabled(false);
            },


            // =====================================================
            // CANCEL
            // =====================================================

            onCancel: function () {

                if (this._oModelDialog) {
                    this._oModelDialog.close();
                }

            },


            // =====================================================
            // CREATE DIALOG
            // =====================================================

            _openModelDialog: function (sTitle, oData) {

                if (!this._oModelDialog) {

                    // ==========================================
                    // CONTROLS
                    // ==========================================

                    this._oModelCodeInput = new Input({
                        placeholder: "Enter model code",
                        width: "100%"
                    });

                    this._oValidFromInput = new DatePicker({
                        valueFormat: "yyyy-MM-dd",
                        displayFormat: "dd-MM-yyyy",
                        placeholder: "Select date",
                        width: "100%"
                    });

                    this._oOrderTypeInput = new Select({
                        width: "100%",
                        items: [
                            new Item({
                                key: "MTS",
                                text: "MTS"
                            }),
                            new Item({
                                key: "MTO",
                                text: "MTO"
                            })
                        ]
                    });

                    this._oDescriptionInput = new Input({
                        placeholder: "Enter model description",
                        width: "100%"
                    });

                    this._oEngineTypeInput = new Select({
                        width: "100%",
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

                    this._oCCWattInput = new Input({
                        type: "Number",
                        placeholder: "Enter CC / Watt",
                        width: "100%"
                    });

                    this._oGSTInput = new Input({
                        type: "Number",
                        placeholder: "Enter GST %",
                        width: "100%"
                    });

                    this._oDealerMarginInput = new Input({
                        type: "Number",
                        placeholder: "Enter dealer margin %",
                        width: "100%"
                    });

                    this._oCsdDiscountInput = new Input({
                        type: "Number",
                        placeholder: "Enter CSD discount %",
                        width: "100%"
                    });

                    this._oCsdGstInput = new Input({
                        type: "Number",
                        placeholder: "Enter CSD GST %",
                        width: "100%"
                    });

                    this._oGemValueInput = new Input({
                        type: "Number",
                        placeholder: "Enter GeM value",
                        width: "100%"
                    });

                    this._oStatusInput = new Select({
                        width: "100%",
                        items: [
                            new Item({
                                key: "ACTIVE",
                                text: "ACTIVE"
                            }),
                            new Item({
                                key: "INACTIVE",
                                text: "INACTIVE"
                            })
                        ]
                    });

                    this._oApprovalStatusInput = new Select({
                        width: "100%",
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


                    // ==========================================
                    // FORM
                    // ==========================================

                    const oForm = new SimpleForm({

                        editable: true,

                        layout: "ResponsiveGridLayout",

                        labelSpanXL: 4,
                        labelSpanL: 4,
                        labelSpanM: 4,
                        labelSpanS: 12,

                        emptySpanXL: 1,
                        emptySpanL: 1,
                        emptySpanM: 1,
                        emptySpanS: 0,

                        columnsXL: 2,
                        columnsL: 2,
                        columnsM: 1,

                        content: [

                            new Label({
                                text: "Model Code",
                                required: true
                            }),
                            this._oModelCodeInput,

                            new Label({
                                text: "Valid From"
                            }),
                            this._oValidFromInput,

                            new Label({
                                text: "Order Type",
                                required: true
                            }),
                            this._oOrderTypeInput,

                            new Label({
                                text: "Model Description"
                            }),
                            this._oDescriptionInput,

                            new Label({
                                text: "Engine Type",
                                required: true
                            }),
                            this._oEngineTypeInput,

                            new Label({
                                text: "CC / Watt"
                            }),
                            this._oCCWattInput,

                            new Label({
                                text: "GST %"
                            }),
                            this._oGSTInput,

                            new Label({
                                text: "Dealer Margin %"
                            }),
                            this._oDealerMarginInput,

                            new Label({
                                text: "CSD Discount %"
                            }),
                            this._oCsdDiscountInput,

                            new Label({
                                text: "CSD GST %"
                            }),
                            this._oCsdGstInput,

                            new Label({
                                text: "GeM Value"
                            }),
                            this._oGemValueInput,

                            new Label({
                                text: "Status"
                            }),
                            this._oStatusInput,

                            new Label({
                                text: "Approval Status"
                            }),
                            this._oApprovalStatusInput
                        ]
                    });


                    // ==========================================
                    // DIALOG
                    // ==========================================

                    this._oModelDialog = new Dialog({

                        title: sTitle,

                        contentWidth: "800px",

                        draggable: true,
                        resizable: true,

                        content: [
                            oForm
                        ],

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

                    this.getView().addDependent(
                        this._oModelDialog
                    );
                }


                // ==========================================
                // TITLE
                // ==========================================

                this._oModelDialog.setTitle(sTitle);


                // ==========================================
                // LOAD DATA FOR EDIT
                // ==========================================

                if (oData) {

                    this._oModelCodeInput.setValue(
                        oData.modelCode || ""
                    );

                    this._oValidFromInput.setValue(
                        oData.validFrom || ""
                    );

                    this._oOrderTypeInput.setSelectedKey(
                        oData.orderType || "MTS"
                    );

                    this._oDescriptionInput.setValue(
                        oData.modelDescription || ""
                    );

                    this._oEngineTypeInput.setSelectedKey(
                        oData.engineType || "Petrol"
                    );

                    this._oCCWattInput.setValue(
                        oData.ccWatt ?? ""
                    );

                    this._oGSTInput.setValue(
                        oData.gstPercent ?? ""
                    );

                    this._oDealerMarginInput.setValue(
                        oData.dealerMarginPercent ?? ""
                    );

                    this._oCsdDiscountInput.setValue(
                        oData.csdDiscountPercent ?? ""
                    );

                    this._oCsdGstInput.setValue(
                        oData.csdGstPercent ?? ""
                    );

                    this._oGemValueInput.setValue(
                        oData.gemValue ?? ""
                    );

                    this._oStatusInput.setSelectedKey(
                        oData.status || "ACTIVE"
                    );

                    this._oApprovalStatusInput.setSelectedKey(
                        oData.approvalStatus || "DRAFT"
                    );
                }


                this._oModelDialog.open();
            },


            // =====================================================
            // SAVE
            // =====================================================

            onSave: async function () {

                const oModel = this.getView().getModel();

                try {

                    // ==========================================
                    // READ VALUES
                    // ==========================================

                    const sModelCode =
                        this._oModelCodeInput
                            .getValue()
                            .trim();

                    const sValidFrom =
                        this._oValidFromInput.getValue();

                    const sOrderType =
                        this._oOrderTypeInput.getSelectedKey();

                    const sDescription =
                        this._oDescriptionInput
                            .getValue()
                            .trim();

                    const sEngineType =
                        this._oEngineTypeInput.getSelectedKey();

                    const sCCWatt =
                        this._oCCWattInput.getValue();

                    const sGST =
                        this._oGSTInput.getValue();

                    const sDealerMargin =
                        this._oDealerMarginInput.getValue();

                    const sCsdDiscount =
                        this._oCsdDiscountInput.getValue();

                    const sCsdGst =
                        this._oCsdGstInput.getValue();

                    const sGemValue =
                        this._oGemValueInput.getValue();

                    const sStatus =
                        this._oStatusInput.getSelectedKey();

                    const sApprovalStatus =
                        this._oApprovalStatusInput.getSelectedKey();


                    // ==========================================
                    // VALIDATION
                    // ==========================================

                    if (!sModelCode) {
                        MessageBox.error("Model Code is required.");
                        return;
                    }

                    if (!sOrderType) {
                        MessageBox.error("Order Type is required.");
                        return;
                    }

                    if (!sEngineType) {
                        MessageBox.error("Engine Type is required.");
                        return;
                    }


                    // ==========================================
                    // PAYLOAD
                    // ==========================================

                    const oPayload = {

                        validFrom:
                            sValidFrom || null,

                        orderType:
                            sOrderType,

                        modelDescription:
                            sDescription,

                        engineType:
                            sEngineType,

                        ccWatt:
                            sCCWatt !== ""
                                ? Number(sCCWatt)
                                : null,

                        gstPercent:
                            sGST !== ""
                                ? Number(sGST)
                                : null,

                        dealerMarginPercent:
                            sDealerMargin !== ""
                                ? Number(sDealerMargin)
                                : null,

                        csdDiscountPercent:
                            sCsdDiscount !== ""
                                ? Number(sCsdDiscount)
                                : null,

                        csdGstPercent:
                            sCsdGst !== ""
                                ? Number(sCsdGst)
                                : null,

                        gemValue:
                            sGemValue !== ""
                                ? Number(sGemValue)
                                : null,

                        status:
                            sStatus,

                        approvalStatus:
                            sApprovalStatus
                    };


                    console.log(
                        "MODEL PAYLOAD:",
                        oPayload
                    );


                    // ==========================================
                    // EDIT
                    // ==========================================

                    if (
                        this._isEditMode &&
                        this._oEditContext
                    ) {

                        Object.keys(oPayload).forEach(
                            function (sProperty) {

                                this._oEditContext.setProperty(
                                    sProperty,
                                    oPayload[sProperty]
                                );

                            }.bind(this)
                        );

                        MessageToast.show(
                            "Model updated successfully"
                        );
                    }


                    // ==========================================
                    // CREATE
                    // ==========================================

                    else {

                        const oCreatePayload = {

                            modelCode:
                                sModelCode,

                            ...oPayload
                        };


                        console.log(
                            "CREATE PAYLOAD:",
                            oCreatePayload
                        );


                        const oListBinding =
                            oModel.bindList("/Models");


                        const oContext =
                            oListBinding.create(
                                oCreatePayload
                            );


                        await oContext.created();


                        MessageToast.show(
                            "Model created successfully"
                        );
                    }


                    this._oModelDialog.close();

                }
                catch (oError) {

                    console.error(
                        "MODEL SAVE ERROR:",
                        oError
                    );

                    MessageBox.error(
                        oError.message ||
                        "Failed to save model."
                    );
                }
            },


            // =====================================================
            // DELETE
            // =====================================================

            onDelete: function (oEvent) {

                const oContext =
                    oEvent
                        .getSource()
                        .getBindingContext();


                if (!oContext) {

                    MessageBox.error(
                        "Unable to get selected model."
                    );

                    return;
                }


                const sModelCode =
                    oContext.getProperty(
                        "modelCode"
                    );


                MessageBox.confirm(

                    "Are you sure you want to delete model " +
                    sModelCode +
                    "?",

                    {

                        title: "Delete Model",

                        onClose:
                            async function (sAction) {

                                if (
                                    sAction !==
                                    MessageBox.Action.OK
                                ) {
                                    return;
                                }


                                try {

                                    await oContext.delete();


                                    MessageToast.show(
                                        "Model deleted successfully"
                                    );

                                }
                                catch (oError) {

                                    console.error(
                                        "DELETE ERROR:",
                                        oError
                                    );


                                    MessageBox.error(
                                        oError.message ||
                                        "Failed to delete model."
                                    );

                                }

                            }

                    }

                );

            }

        }

    );

});