sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Label",
    "sap/ui/layout/form/SimpleForm",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/DatePicker",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/FilterType"
], function (
    Controller,
    Dialog,
    Button,
    Input,
    Label,
    SimpleForm,
    MessageToast,
    MessageBox,
    DatePicker,
    Filter,
    FilterOperator,
    FilterType

) {

    "use strict";

    return Controller.extend(
        "vpamasterdata.controller.Parts",
        {

            onNavBack: function () {

                this.getOwnerComponent()
                    .getRouter()
                    .navTo("RouteView1");

            },

            onAdd: function () {

                this._isEditMode = false;
                this._oEditContext = null;

                this._openPartDialog("Add Part");
            },

            onEdit: function (oEvent) {

                const oContext = oEvent.getSource().getBindingContext();
                const oData = oContext.getObject();

                this._isEditMode = true;
                this._oEditContext = oContext;

                this._openPartDialog("Edit Part", oData);
            },


            onGoFilter: function () {

    const oTable = this.byId("partsTable");
    const oBinding = oTable.getBinding("items");

    const aFilters = [];

    const sPartCode =
        this.byId("partCodeFilter").getSelectedKey();

    const sDescription =
        this.byId("partDescriptionFilter").getSelectedKey();


    if (sPartCode) {

        aFilters.push(
            new Filter(
                "partCode",
                FilterOperator.EQ,
                sPartCode
            )
        );

    }


    if (sDescription) {

        aFilters.push(
            new Filter(
                "description",
                FilterOperator.EQ,
                sDescription
            )
        );

    }


    oBinding.filter(
        aFilters,
        FilterType.Application
    );
},


onClearFilter: function () {

    this.byId("partCodeFilter").setSelectedKey("");

    this.byId("partDescriptionFilter").setSelectedKey("");


    this.byId("partsTable")
        .getBinding("items")
        .filter(
            [],
            FilterType.Application
        );
},

            _openPartDialog: function (sTitle, oData) {

                if (!this._oPartDialog) {

                    this._oPartCodeInput = new Input();

                    this._oValidFromInput = new DatePicker({
                        valueFormat: "yyyy-MM-dd",
                        displayFormat: "dd-MMM-yyyy",
                        minDate: new Date()
                    });

                    this._oDescriptionInput = new Input();
                    this._oMiyCostInput = new Input();
                    this._oMiyMarkupInput = new Input();
                    this._oPriceIndicatorInput = new Input();

                    const oForm = new SimpleForm({
                        editable: true,
                        content: [

                            new Label({ text: "Part Code" }),
                            this._oPartCodeInput,

                            new Label({ text: "Valid From" }),
                            this._oValidFromInput,

                            new Label({ text: "Description" }),
                            this._oDescriptionInput,

                            new Label({ text: "MIY Cost" }),
                            this._oMiyCostInput,

                            new Label({ text: "MIY Markup" }),
                            this._oMiyMarkupInput,

                            new Label({ text: "Price Indicator" }),
                            this._oPriceIndicatorInput
                        ]
                    });

                    this._oPartDialog = new Dialog({
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

                // ADD
                if (!oData) {

                    this._oPartCodeInput.setValue("");
                    this._oValidFromInput.setValue("");
                    this._oDescriptionInput.setValue("");
                    this._oMiyCostInput.setValue("");
                    this._oMiyMarkupInput.setValue("");
                    this._oPriceIndicatorInput.setValue("");

                    this._oPartCodeInput.setEnabled(true);

                }

                // EDIT
                else {

                    this._oPartCodeInput.setValue(
                        oData.partCode || ""
                    );

                    this._oValidFromInput.setValue(
                        oData.validFrom || ""
                    );

                    this._oDescriptionInput.setValue(
                        oData.description || ""
                    );

                    this._oMiyCostInput.setValue(
                        oData.miyCost != null ? oData.miyCost : ""
                    );

                    this._oMiyMarkupInput.setValue(
                        oData.miyMarkup != null ? oData.miyMarkup : ""
                    );

                    this._oPriceIndicatorInput.setValue(
                        oData.priceIndicator || ""
                    );

                    // Key should not be changed
                    this._oPartCodeInput.setEnabled(false);
                }

                this._oPartDialog.setTitle(sTitle);
                this._oPartDialog.open();
            },

            onSave: async function () {

                const oModel = this.getView().getModel();

                const sPartCode = this._oPartCodeInput.getValue().trim();

                if (!sPartCode) {
                    MessageBox.error("Part Code is required.");
                    return;
                }

                const oPayload = {

                    validFrom:
                        this._oValidFromInput.getValue() || null,

                    description:
                        this._oDescriptionInput.getValue(),

                    miyCost:
                        this._getNumber(
                            this._oMiyCostInput.getValue()
                        ),

                    miyMarkup:
                        this._getNumber(
                            this._oMiyMarkupInput.getValue()
                        ),

                    priceIndicator:
                        this._oPriceIndicatorInput.getValue()
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

                        MessageToast.show(
                            "Part updated successfully."
                        );

                    }

                    // CREATE
                    else {

                        const oListBinding =
                            oModel.bindList("/Parts");

                        const oContext =
                            oListBinding.create({
                                partCode: sPartCode,
                                ...oPayload
                            });

                        await oContext.created();

                        MessageToast.show(
                            "Part created successfully."
                        );
                    }

                    this._oPartDialog.close();

                } catch (oError) {

                    console.error(oError);

                    MessageBox.error(
                        oError.message || "Operation failed."
                    );
                }
            },


            onDelete: function (oEvent) {

                const oContext = oEvent.getSource().getBindingContext();

                MessageBox.confirm(
                    "Are you sure you want to delete this Part?",
                    {
                        title: "Confirm Delete",

                        onClose: async function (sAction) {

                            if (sAction !== MessageBox.Action.OK) {
                                return;
                            }

                            try {

                                await oContext.delete();

                                MessageToast.show(
                                    "Part deleted successfully."
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

                if (
                    sValue === "" ||
                    sValue === null ||
                    sValue === undefined
                ) {
                    return null;
                }

                return Number(sValue);
            },

            onCancel: function () {
                this._oPartDialog.close();
            },

        }
    );

});