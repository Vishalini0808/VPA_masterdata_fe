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
    DatePicker,
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
        "vpamasterdata.controller.RTOMasters",
        {

            onNavBack: function () {
                this.getOwnerComponent()
                    .getRouter()
                    .navTo("RouteView1");
            },


            /* ---------- Filter bar ---------- */

            // =========================================================
            // FILTER (Go)
            // =========================================================

            onFilter: function () {

                const aFilters = [];

                const sRegion =
                    this.byId("regionFilter").getSelectedKey();

                const sEngineType =
                    this.byId("engineTypeFilter").getSelectedKey();

                const sApprovalStatus =
                    this.byId("approvalStatusFilter").getSelectedKey();

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
                    this.byId("rtoMastersTable").getBinding("items");

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

                this.byId("regionFilter").setSelectedKey("");
                this.byId("engineTypeFilter").setSelectedKey("");
                this.byId("approvalStatusFilter").setSelectedKey("");

                const oBinding =
                    this.byId("rtoMastersTable").getBinding("items");

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

                            this.byId("regionFilter")
                                .setVisible(oRegionCB.getSelected());

                            this.byId("engineTypeFilter")
                                .setVisible(oEngineCB.getSelected());

                            this.byId("approvalStatusFilter")
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

            // =========================================================
            // DELETE
            // =========================================================

            onDelete: function (oEvent) {

                const oContext =
                    oEvent.getSource().getBindingContext();

                if (!oContext) {
                    return;
                }

                MessageBox.confirm(
                    "Do you want to delete this RTO Master (" +
                    oContext.getProperty("region_regionCode") + ", slab " +
                    oContext.getProperty("slab") + ")?",
                    {
                        title: "Delete RTO Master",

                        onClose: async function (sAction) {

                            if (sAction !== MessageBox.Action.OK) {
                                return;
                            }

                            try {
                                await oContext.delete();
                                MessageToast.show("RTO Master deleted successfully.");
                            } catch (oError) {
                                MessageBox.error(
                                    oError.message || "Failed to delete RTO Master.");
                            }
                        }
                    }
                );
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

                this._oRegionInput.setEditable(!oData);

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

                    slab: Number(sSlab),

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

                    if (this._isEditMode && this._oEditContext) {

                        // ---------- EDIT ----------
                        const oCtx = this._oEditContext;

                        await Promise.all(
                            Object.keys(oPayload)
                                .filter((sKey) => sKey !== "region_regionCode")
                                .map((sKey) =>
                                    oCtx.setProperty(sKey, oPayload[sKey]))
                        );

                        MessageToast.show(
                            "RTO Master updated successfully");

                    } else {

                        // ---------- CREATE (on the table's own binding,
                        // so the new row shows up in the list) ----------
                        const oListBinding =
                            this.byId("rtoMastersTable")
                                .getBinding("items");

                        const oContext =
                            oListBinding.create(oPayload);

                        await oContext.created();

                        MessageToast.show(
                            "RTO Master created successfully");
                    }

                    this._oRTODialog.close();

                    this._oEditContext = null;
                    this._isEditMode = false;

                } catch (oError) {

                    console.error(oError);

                    MessageBox.error(
                        oError.message || "Failed to save RTO Master."
                    );
                }
            },

            _getNumber: function (oInput) {

                const sValue = oInput.getValue();

                return sValue !== ""
                    ? Number(sValue)
                    : null;
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