sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/DatePicker",
    "sap/ui/layout/form/SimpleForm"
], function (
    Controller,
    Dialog,
    Button,
    Input,
    Label,
    MessageToast,
    MessageBox,
    DatePicker,
    SimpleForm
) {

    "use strict";

    return Controller.extend(
        "vpamasterdata.controller.MTOConfigurations",
        {

            // =========================
            // NAVIGATION
            // =========================

            onNavBack: function () {

                this.getOwnerComponent()
                    .getRouter()
                    .navTo("RouteView1");

            },


            // =========================
            // ADD
            // =========================

            onAdd: function () {

                this._isEditMode = false;
                this._oEditContext = null;

                this._openMTODialog("Add MTO Configuration");

            },


            // =========================
            // EDIT
            // =========================

            onEdit: function (oEvent) {

                const oContext =
                    oEvent.getSource().getBindingContext();

                const oData =
                    oContext.getObject();

                this._isEditMode = true;
                this._oEditContext = oContext;

                this._openMTODialog(
                    "Edit MTO Configuration",
                    oData
                );

            },


            // =========================
            // OPEN DIALOG
            // =========================

            _openMTODialog: function (sTitle, oData) {

                if (!this._oMTODialog) {

                    this._oMTOModelCodeInput =
                        new Input();

                    this._oValidFromInput =
                        new DatePicker({
                            valueFormat: "yyyy-MM-dd",
                            displayFormat: "dd-MMM-yyyy"
                        });

                    this._oReferenceMTSInput =
                        new Input();


                    const oForm =
                        new SimpleForm({

                            editable: true,

                            content: [

                                new Label({
                                    text: "MTO Model Code"
                                }),

                                this._oMTOModelCodeInput,


                                new Label({
                                    text: "Valid From"
                                }),

                                this._oValidFromInput,


                                new Label({
                                    text: "Reference MTS Model"
                                }),

                                this._oReferenceMTSInput

                            ]
                        });


                    this._oMTODialog =
                        new Dialog({

                            title: sTitle,

                            contentWidth: "500px",

                            content: oForm,


                            beginButton:
                                new Button({

                                    text: "Save",

                                    type: "Emphasized",

                                    press:
                                        this.onSave.bind(this)

                                }),


                            endButton:
                                new Button({

                                    text: "Cancel",

                                    press:
                                        this.onCancel.bind(this)

                                })

                        });

                }


                // =========================
                // ADD MODE
                // =========================

                if (!oData) {

                    this._oMTOModelCodeInput
                        .setValue("");

                    this._oValidFromInput
                        .setValue("");

                    this._oReferenceMTSInput
                        .setValue("");

                    // Key can be entered
                    this._oMTOModelCodeInput
                        .setEnabled(true);

                }


                // =========================
                // EDIT MODE
                // =========================

                else {

                    this._oMTOModelCodeInput
                        .setValue(
                            oData.mtoModelCode || ""
                        );


                    this._oValidFromInput
                        .setValue(
                            oData.validFrom || ""
                        );


                    this._oReferenceMTSInput
                        .setValue(
                            oData.referenceMTSModel_modelCode || ""
                        );


                    // Key should not be changed
                    this._oMTOModelCodeInput
                        .setEnabled(false);

                }


                this._oMTODialog
                    .setTitle(sTitle);

                this._oMTODialog
                    .open();

            },


            // =========================
            // SAVE
            // =========================

            onSave: async function () {

                const oModel =
                    this.getView().getModel();


                const sMTOModelCode =
                    this._oMTOModelCodeInput
                        .getValue()
                        .trim();


                const sValidFrom =
                    this._oValidFromInput
                        .getValue();


                const sReferenceMTS =
                    this._oReferenceMTSInput
                        .getValue()
                        .trim();


                // Validation
                if (!sMTOModelCode) {

                    MessageBox.error(
                        "MTO Model Code is required."
                    );

                    return;
                }


                const oPayload = {

                    validFrom:
                        sValidFrom || null,

                    referenceMTSModel_modelCode:
                        sReferenceMTS || null

                };


                try {

                    // =========================
                    // EDIT
                    // =========================

                    if (this._isEditMode) {

                        Object.keys(oPayload)
                            .forEach((sProperty) => {

                                this._oEditContext
                                    .setProperty(
                                        sProperty,
                                        oPayload[sProperty]
                                    );

                            });


                        await this._oEditContext
                            .requestObject();


                        MessageToast.show(
                            "MTO Configuration updated successfully."
                        );

                    }


                    // =========================
                    // CREATE
                    // =========================

                    else {

                        const oListBinding =
                            oModel.bindList(
                                "/MTOConfigurations"
                            );


                        const oContext =
                            oListBinding.create({

                                mtoModelCode:
                                    sMTOModelCode,

                                ...oPayload

                            });


                        await oContext.created();


                        MessageToast.show(
                            "MTO Configuration created successfully."
                        );

                    }


                    this._oMTODialog.close();


                } catch (oError) {

                    console.error(oError);

                    MessageBox.error(
                        oError.message ||
                        "Operation failed."
                    );

                }

            },


            // =========================
            // DELETE
            // =========================

            onDelete: function (oEvent) {

                const oContext =
                    oEvent.getSource()
                        .getBindingContext();


                MessageBox.confirm(

                    "Are you sure you want to delete this MTO Configuration?",

                    {

                        title: "Confirm Delete",


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
                                        "MTO Configuration deleted successfully."
                                    );


                                } catch (oError) {

                                    console.error(oError);


                                    MessageBox.error(
                                        oError.message ||
                                        "Delete failed."
                                    );

                                }

                            }

                    }

                );

            },


            // =========================
            // CANCEL
            // =========================

            onCancel: function () {

                this._oMTODialog.close();

            }

        }
    );

});