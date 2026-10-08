sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/DatePicker",
    "sap/ui/layout/form/SimpleForm",
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
    Label,
    MessageToast,
    MessageBox,
    DatePicker,
    SimpleForm,
    Filter,
    FilterOperator,
    FilterType,
    CheckBox,
    VBox
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
            // FILTER (Go)
            // =========================

            onFilter: function () {

                const aFilters = [];

                const sMTOModelCode =
                    this.byId("mtoModelCodeFilter").getSelectedKey();

                const sReferenceMTS =
                    this.byId("mtoReferenceMTSFilter").getSelectedKey();

                const sValidFrom =
                    this.byId("mtoValidFromFilter").getValue();

                if (sMTOModelCode) {
                    aFilters.push(new Filter(
                        "mtoModelCode", FilterOperator.EQ, sMTOModelCode));
                }

                if (sReferenceMTS) {
                    aFilters.push(new Filter(
                        "referenceMTSModel_modelCode",
                        FilterOperator.EQ, sReferenceMTS));
                }

                if (sValidFrom) {
                    aFilters.push(new Filter(
                        "validFrom", FilterOperator.EQ, sValidFrom));
                }

                const oBinding =
                    this.byId("mtoConfigurationsTable").getBinding("items");

                if (oBinding) {
                    oBinding.filter(aFilters, FilterType.Application);
                }

                MessageToast.show(
                    aFilters.length === 0
                        ? "All filters cleared."
                        : "Filter applied."
                );
            },


            // =========================
            // CLEAR FILTERS
            // =========================

            onClearFilters: function () {

                this.byId("mtoModelCodeFilter").setSelectedKey("");
                this.byId("mtoReferenceMTSFilter").setSelectedKey("");
                this.byId("mtoValidFromFilter").setValue("");

                const oBinding =
                    this.byId("mtoConfigurationsTable").getBinding("items");

                if (oBinding) {
                    oBinding.filter([]);
                }

                MessageToast.show("Filters cleared.");
            },


            // =========================
            // ADAPT FILTERS (show / hide filter fields)
            // =========================

            onAdaptFilters: function () {

                if (this._oAdaptFilterDialog) {
                    this._oAdaptFilterDialog.open();
                    return;
                }

                const oCodeCB = new CheckBox({ text: "MTO Model Code", selected: true });
                const oMTSCB = new CheckBox({ text: "Reference MTS Model", selected: true });
                const oDateCB = new CheckBox({ text: "Valid From", selected: true });

                this._oAdaptFilterDialog = new Dialog({

                    title: "Adapt Filters",
                    contentWidth: "350px",

                    content: [
                        new VBox({
                            class: "sapUiMediumMargin",
                            items: [
                                new Label({ text: "Select filter fields" }),
                                oCodeCB,
                                oMTSCB,
                                oDateCB
                            ]
                        })
                    ],

                    beginButton: new Button({
                        text: "Apply",
                        type: "Emphasized",
                        press: function () {

                            this.byId("mtoModelCodeFilter")
                                .setVisible(oCodeCB.getSelected());

                            this.byId("mtoReferenceMTSFilter")
                                .setVisible(oMTSCB.getSelected());

                            this.byId("mtoValidFromFilter")
                                .setVisible(oDateCB.getSelected());

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

                        await Promise.all(
                            Object.keys(oPayload).map((sProperty) =>
                                this._oEditContext.setProperty(
                                    sProperty,
                                    oPayload[sProperty]
                                )
                            )
                        );


                        MessageToast.show(
                            "MTO Configuration updated successfully."
                        );

                    }


                    // =========================
                    // CREATE
                    // =========================

                    else {

                        const oListBinding =
                            this.byId("mtoConfigurationsTable")
                                .getBinding("items");


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

                    this._oEditContext = null;
                    this._isEditMode = false;

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

            },


            // =========================
            // EXIT
            // =========================

            onExit: function () {

                if (this._oAdaptFilterDialog) {
                    this._oAdaptFilterDialog.destroy();
                    this._oAdaptFilterDialog = null;
                }
            },


            onConfigurationPress: function (oEvent) {


                const oContext =
                    oEvent.getSource().getBindingContext();

                const sMTOModelCode =
                    oContext.getProperty("mtoModelCode");

                this.getOwnerComponent()
                    .getRouter()
                    .navTo(
                        "MTOConfigurationObject",
                        {
                            mtoModelCode: encodeURIComponent(
                                sMTOModelCode
                            )
                        }
                    );


            }

        }
    );
});