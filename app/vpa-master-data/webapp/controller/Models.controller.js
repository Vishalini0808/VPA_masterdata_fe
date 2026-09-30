sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/FilterType"
], function (
    Controller,
    MessageToast,
    MessageBox,
    Filter,
    FilterOperator,
    FilterType
) {

    "use strict";

    return Controller.extend(
        "vpamasterdata.controller.Models",
        {


            onInit: function () {

                this._isEditMode = false;
                this._oEditContext = null;

                // this._loadFilterValues();


            },


            onNavBack: function () {

                this.getOwnerComponent()
                    .getRouter()
                    .navTo("RouteView1");
            },



            onGoFilter: function () {

                const oTable = this.byId("modelTable");
                const oBinding = oTable.getBinding("items");

                const aFilters = [];

                // Model Code
                const sModelCode =
                    this.byId("modelCodeFilter").getSelectedKey();

                console.log("Selected Model Code:", sModelCode);


                if (sModelCode) {

                    aFilters.push(
                        new Filter(
                            "modelCode",
                            FilterOperator.EQ,
                            sModelCode
                        )
                    );
                }


                // Model Description
                const sDescription =
                    this.byId("modelDescriptionFilter").getSelectedKey();

                console.log("Selected Description:", sDescription);


                if (sDescription) {

                    aFilters.push(
                        new Filter(
                            "modelDescription",
                            FilterOperator.EQ,
                            sDescription
                        )
                    );
                }


                // Order Type
                const sOrderType =
                    this.byId("orderTypeFilter").getSelectedKey();

                console.log("Selected Order Type:", sOrderType);


                if (sOrderType) {

                    aFilters.push(
                        new Filter(
                            "orderType",
                            FilterOperator.EQ,
                            sOrderType
                        )
                    );
                }


                console.log("Filters:", aFilters);


                // Apply filters
                oBinding.filter(
                    aFilters,
                    FilterType.Application
                );
            },


            // =====================================================
            // CLEAR FILTER
            // =====================================================

            onClearFilter: function () {

                this.byId("modelCodeFilter")
                    .setSelectedKey("");

                this.byId("modelDescriptionFilter")
                    .setSelectedKey("");

                this.byId("orderTypeFilter")
                    .setSelectedKey("");


                const oBinding =
                    this.byId("modelTable")
                        .getBinding("items");


                oBinding.filter(
                    [],
                    FilterType.Application
                );
            },

            // =====================================================
            // ADAPT FILTERS
            // =====================================================

            onAdaptFilters: function () {

                MessageToast.show(
                    "Adapt Filters can be configured here."
                );

            },


            // =====================================================
            // ADD MODEL
            // =====================================================

            onAdd: function () {

                this._isEditMode = false;
                this._oEditContext = null;


                const oDialog =
                    this.byId("modelDialog");


                oDialog.setTitle(
                    "Add Model"
                );


                // ---------------------------------------------
                // RESET FIELDS
                // ---------------------------------------------

                this.byId("modelCodeInput")
                    .setValue("");

                this.byId("validFromInput")
                    .setValue("");

                this.byId("orderTypeInput")
                    .setSelectedKey("MTS");

                this.byId("modelDescriptionInput")
                    .setValue("");

                this.byId("engineTypeInput")
                    .setSelectedKey("Petrol");

                this.byId("ccWattInput")
                    .setValue("");

                this.byId("gstPercentInput")
                    .setValue("");

                this.byId("dealerMarginPercentInput")
                    .setValue("");

                this.byId("csdDiscountPercentInput")
                    .setValue("");

                this.byId("csdGstPercentInput")
                    .setValue("");

                this.byId("gemValueInput")
                    .setValue("");

                this.byId("statusInput")
                    .setSelectedKey("ACTIVE");

                this.byId("approvalStatusInput")
                    .setSelectedKey("DRAFT");


                // Model Code editable during create

                this.byId("modelCodeInput")
                    .setEnabled(true);


                oDialog.open();

            },


            // =====================================================
            // EDIT MODEL
            // =====================================================

            onEdit: function (oEvent) {

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


                this._isEditMode = true;
                this._oEditContext = oContext;


                const oData =
                    oContext.getObject();


                const oDialog =
                    this.byId("modelDialog");


                oDialog.setTitle(
                    "Edit Model"
                );


                // ---------------------------------------------
                // LOAD DATA
                // ---------------------------------------------

                this.byId("modelCodeInput")
                    .setValue(
                        oData.modelCode || ""
                    );

                this.byId("validFromInput")
                    .setValue(
                        oData.validFrom || ""
                    );

                this.byId("orderTypeInput")
                    .setSelectedKey(
                        oData.orderType || "MTS"
                    );

                this.byId("modelDescriptionInput")
                    .setValue(
                        oData.modelDescription || ""
                    );

                this.byId("engineTypeInput")
                    .setSelectedKey(
                        oData.engineType || "Petrol"
                    );

                this.byId("ccWattInput")
                    .setValue(
                        oData.ccWatt ?? ""
                    );

                this.byId("gstPercentInput")
                    .setValue(
                        oData.gstPercent ?? ""
                    );

                this.byId("dealerMarginPercentInput")
                    .setValue(
                        oData.dealerMarginPercent ?? ""
                    );

                this.byId("csdDiscountPercentInput")
                    .setValue(
                        oData.csdDiscountPercent ?? ""
                    );

                this.byId("csdGstPercentInput")
                    .setValue(
                        oData.csdGstPercent ?? ""
                    );

                this.byId("gemValueInput")
                    .setValue(
                        oData.gemValue ?? ""
                    );

                this.byId("statusInput")
                    .setSelectedKey(
                        oData.status || "ACTIVE"
                    );

                this.byId("approvalStatusInput")
                    .setSelectedKey(
                        oData.approvalStatus || "DRAFT"
                    );


                // Model Code should not be changed during edit

                this.byId("modelCodeInput")
                    .setEnabled(false);


                oDialog.open();

            },


            // =====================================================
            // CANCEL
            // =====================================================

            onCancel: function () {

                this.byId("modelDialog")
                    .close();

            },


            // =====================================================
            // SAVE
            // =====================================================

            onSave: async function () {

                const oModel =
                    this.getView().getModel();


                try {

                    // ---------------------------------------------
                    // READ VALUES
                    // ---------------------------------------------

                    const sModelCode =
                        this.byId("modelCodeInput")
                            .getValue()
                            .trim();

                    const sValidFrom =
                        this.byId("validFromInput")
                            .getValue();

                    const sOrderType =
                        this.byId("orderTypeInput")
                            .getSelectedKey();

                    const sDescription =
                        this.byId("modelDescriptionInput")
                            .getValue()
                            .trim();

                    const sEngineType =
                        this.byId("engineTypeInput")
                            .getSelectedKey();

                    const sCCWatt =
                        this.byId("ccWattInput")
                            .getValue();

                    const sGST =
                        this.byId("gstPercentInput")
                            .getValue();

                    const sDealerMargin =
                        this.byId("dealerMarginPercentInput")
                            .getValue();

                    const sCsdDiscount =
                        this.byId("csdDiscountPercentInput")
                            .getValue();

                    const sCsdGst =
                        this.byId("csdGstPercentInput")
                            .getValue();

                    const sGemValue =
                        this.byId("gemValueInput")
                            .getValue();

                    const sStatus =
                        this.byId("statusInput")
                            .getSelectedKey();

                    const sApprovalStatus =
                        this.byId("approvalStatusInput")
                            .getSelectedKey();


                    // ---------------------------------------------
                    // VALIDATION
                    // ---------------------------------------------

                    if (!sModelCode) {

                        MessageBox.error(
                            "Model Code is required."
                        );

                        return;
                    }


                    if (!sOrderType) {

                        MessageBox.error(
                            "Order Type is required."
                        );

                        return;
                    }


                    if (!sEngineType) {

                        MessageBox.error(
                            "Engine Type is required."
                        );

                        return;
                    }


                    // ---------------------------------------------
                    // PAYLOAD
                    // ---------------------------------------------

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


                    // =================================================
                    // EDIT
                    // =================================================

                    if (
                        this._isEditMode &&
                        this._oEditContext
                    ) {

                        const aProperties =
                            Object.keys(oPayload);


                        await Promise.all(
                            aProperties.map(
                                function (sProperty) {

                                    return this._oEditContext
                                        .setProperty(
                                            sProperty,
                                            oPayload[sProperty]
                                        );

                                }.bind(this)
                            )
                        );


                        MessageToast.show(
                            "Model updated successfully."
                        );

                    }


                    // =================================================
                    // CREATE
                    // =================================================

                    else {

                        const oCreatePayload = {

                            modelCode:
                                sModelCode,

                            ...oPayload
                        };


                        const oListBinding =
                            oModel.bindList(
                                "/Models"
                            );


                        const oContext =
                            oListBinding.create(
                                oCreatePayload
                            );


                        await oContext.created();


                        MessageToast.show(
                            "Model created successfully."
                        );

                    }


                    // ---------------------------------------------
                    // CLOSE
                    // ---------------------------------------------

                    this.byId("modelDialog")
                        .close();


                    // ---------------------------------------------
                    // RESET EDIT STATE
                    // ---------------------------------------------

                    this._isEditMode = false;
                    this._oEditContext = null;

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

                        onClose: async function (sAction) {

                            if (
                                sAction !==
                                MessageBox.Action.OK
                            ) {
                                return;
                            }


                            try {

                                await oContext.delete();


                                MessageToast.show(
                                    "Model deleted successfully."
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

            },


            // =====================================================
            // VIEW DETAILS
            // =====================================================

            onView: function (oEvent) {

                const oContext =
                    oEvent
                        .getSource()
                        .getBindingContext();


                if (!oContext) {
                    return;
                }


                const oData =
                    oContext.getObject();


                MessageToast.show(
                    "Selected Model: " +
                    oData.modelCode
                );

                // Later you can navigate to a Model
                // Object Page from here.

            }

        }

    );

});