sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/CheckBox",
    "sap/m/VBox",
    "sap/m/Label",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel"
], function (
    Controller,
    MessageToast,
    MessageBox,
    Dialog,
    Button,
    CheckBox,
    VBox,
    Label,
    Filter,
    FilterOperator,
    JSONModel
) {
    "use strict";
 
    return Controller.extend(
        "vpamasterdata.controller.Regions",
        {
 
            // =========================================================
            // INITIALIZATION
            // =========================================================
 
            onInit: function () {
 
                const oModel = this.getView().getModel();
 
                if (!oModel) {
                    return;
                }
 
                const oBinding = oModel.bindList("/Regions");
 
                oBinding
                    .requestContexts(0, 1000)
                    .then(function (aContexts) {
 
                        const aRegions = aContexts.map(
                            function (oContext) {
                                return oContext.getObject();
                            }
                        );
 
                        const aRegionCodes = [];
                        const aRegionNames = [];
                        const aRtoBasis = [];
 
                        aRegions.forEach(function (oRegion) {
 
                            // -----------------------------------------
                            // REGION CODE
                            // -----------------------------------------
 
                            if (
                                oRegion.regionCode &&
                                !aRegionCodes.some(
                                    function (oItem) {
                                        return oItem.key ===
                                            oRegion.regionCode;
                                    }
                                )
                            ) {
 
                                aRegionCodes.push({
                                    key: oRegion.regionCode,
                                    text: oRegion.regionCode
                                });
 
                            }
 
 
                            // -----------------------------------------
                            // REGION NAME
                            // -----------------------------------------
 
                            if (
                                oRegion.regionName &&
                                !aRegionNames.some(
                                    function (oItem) {
                                        return oItem.key ===
                                            oRegion.regionName;
                                    }
                                )
                            ) {
 
                                aRegionNames.push({
                                    key: oRegion.regionName,
                                    text: oRegion.regionName
                                });
 
                            }
 
 
                            // -----------------------------------------
                            // RTO BASIS
                            // -----------------------------------------
 
                            if (
                                oRegion.rtoBasis &&
                                !aRtoBasis.some(
                                    function (oItem) {
                                        return oItem.key ===
                                            oRegion.rtoBasis;
                                    }
                                )
                            ) {
 
                                aRtoBasis.push({
                                    key: oRegion.rtoBasis,
                                    text: oRegion.rtoBasis
                                });
 
                            }
 
                        });
 
 
                        // ---------------------------------------------
                        // FILTER MODEL
                        // ---------------------------------------------
 
                        const oFilterModel = new JSONModel({
 
                            regionCodes: aRegionCodes,
 
                            regionNames: aRegionNames,
 
                            rtoBasis: aRtoBasis
 
                        });
 
 
                        this.getView().setModel(
                            oFilterModel,
                            "filter"
                        );
 
                    }.bind(this))
 
                    .catch(function () {
 
                        MessageBox.error(
                            "Failed to load filter values."
                        );
 
                    });
 
            },
 
 
            // =========================================================
            // BACK NAVIGATION
            // =========================================================
 
            onPageNavButtonPress: function () {
 
                this.getOwnerComponent()
                    .getRouter()
                    .navTo("RouteView1");
 
            },
 
 
            // =========================================================
            // CREATE REGION
            // =========================================================
 
            onAdd: function () {
 
                // Clear edit mode
                this._oEditContext = null;
 
 
                // Clear fields
                this.byId("regionCodeInput")
                    .setValue("");
 
                this.byId("regionNameInput")
                    .setValue("");
 
                this.byId("rtoBasisInput")
                    .setValue("");
 
 
                // Region Code can be entered
                this.byId("regionCodeInput")
                    .setEditable(true);
 
 
                // Dialog title
                this.byId("regionDialog")
                    .setTitle("Add Region");
 
 
                // Open dialog
                this.byId("regionDialog")
                    .open();
 
            },
 
 
            // =========================================================
            // CANCEL
            // =========================================================
 
            onCancel: function () {
 
                this.byId("regionDialog")
                    .close();
 
                this._oEditContext = null;
 
            },
 
 
            // =========================================================
            // EDIT REGION
            // =========================================================
 
            onEdit: function (oEvent) {
 
                const oContext =
                    oEvent.getSource()
                        .getBindingContext();
 
 
                if (!oContext) {
                    return;
                }
 
 
                // Store context
                this._oEditContext = oContext;
 
 
                // Get existing values
                const sRegionCode =
                    oContext.getProperty("regionCode");
 
                const sRegionName =
                    oContext.getProperty("regionName");
 
                const sRtoBasis =
                    oContext.getProperty("rtoBasis");
 
 
                // Fill dialog
                this.byId("regionCodeInput")
                    .setValue(sRegionCode || "");
 
                this.byId("regionNameInput")
                    .setValue(sRegionName || "");
 
                this.byId("rtoBasisInput")
                    .setValue(sRtoBasis || "");
 
 
                // Primary key cannot be changed
                this.byId("regionCodeInput")
                    .setEditable(false);
 
 
                // Dialog title
                this.byId("regionDialog")
                    .setTitle("Edit Region");
 
 
                // Open dialog
                this.byId("regionDialog")
                    .open();
 
            },
 
 
            // =========================================================
            // SAVE REGION
            // =========================================================
 
            onSave: async function () {
 
                const sRegionCode =
                    this.byId("regionCodeInput")
                        .getValue()
                        .trim();
 
                const sRegionName =
                    this.byId("regionNameInput")
                        .getValue()
                        .trim();
 
                const sRtoBasis =
                    this.byId("rtoBasisInput")
                        .getValue()
                        .trim();
 
 
                // =====================================================
                // VALIDATION
                // =====================================================
 
                if (!sRegionCode) {
 
                    MessageBox.error(
                        "Region Code is required."
                    );
 
                    return;
                }
 
 
                if (!sRegionName) {
 
                    MessageBox.error(
                        "Region Name is required."
                    );
 
                    return;
                }
 
 
                if (!sRtoBasis) {
 
                    MessageBox.error(
                        "RTO Basis is required."
                    );
 
                    return;
                }
 
 
                try {
 
                    // =================================================
                    // EDIT EXISTING REGION
                    // =================================================
 
                    if (this._oEditContext) {
 
                        this._oEditContext.setProperty(
                            "regionName",
                            sRegionName
                        );
 
                        this._oEditContext.setProperty(
                            "rtoBasis",
                            sRtoBasis
                        );
 
 
                        // Wait for update
                        await this._oEditContext
                            .requestObject();
 
 
                        MessageToast.show(
                            "Region updated successfully."
                        );
 
                    }
 
 
                    // =================================================
                    // CREATE NEW REGION
                    // =================================================
 
                    else {
 
                        const oModel =
                            this.getView()
                                .getModel();
 
 
                        const oListBinding =
                            oModel.bindList(
                                "/Regions"
                            );
 
 
                        const oContext =
                            oListBinding.create({
 
                                regionCode:
                                    sRegionCode,
 
                                regionName:
                                    sRegionName,
 
                                rtoBasis:
                                    sRtoBasis
 
                            });
 
 
                        // Wait for create
                        await oContext.created();
 
 
                        MessageToast.show(
                            "Region created successfully."
                        );
 
                    }
 
 
                    // =================================================
                    // CLOSE DIALOG
                    // =================================================
 
                    this.byId("regionDialog")
                        .close();
 
 
                    // Clear edit context
                    this._oEditContext = null;
 
 
                    // Reload filter values
                    this._loadFilterValues();
 
                }
                catch (oError) {
 
                    MessageBox.error(
                        oError.message ||
                        "Failed to save Region."
                    );
 
                }
 
            },
 
 
            // =========================================================
            // DELETE REGION
            // =========================================================
 
            onDelete: function (oEvent) {
 
                const oContext =
                    oEvent.getSource()
                        .getBindingContext();
 
 
                if (!oContext) {
                    return;
                }
 
 
                const sRegionCode =
                    oContext.getProperty(
                        "regionCode"
                    );
 
 
                MessageBox.confirm(
 
                    "Do you want to delete Region " +
                    sRegionCode +
                    "?",
 
                    {
 
                        title: "Delete Region",
 
 
                        onClose: async function (sAction) {
 
                            // User cancelled
                            if (
                                sAction !==
                                MessageBox.Action.OK
                            ) {
                                return;
                            }
 
 
                            try {
 
                                // Delete OData entity
                                await oContext.delete();
 
 
                                MessageToast.show(
                                    "Region deleted successfully."
                                );
 
 
                                // Reload filter values
                                this._loadFilterValues();
 
                            }
                            catch (oError) {
 
                                MessageBox.error(
                                    oError.message ||
                                    "Failed to delete Region."
                                );
 
                            }
 
                        }.bind(this)
 
                    }
 
                );
 
            },
 
 
            // =========================================================
            // ROW NAVIGATION
            // =========================================================
 
            onRegionPress: function (oEvent) {
 
                const oContext =
                    oEvent.getSource()
                        .getBindingContext();
 
 
                if (!oContext) {
                    return;
                }
 
 
                const sRegionCode =
                    oContext.getProperty(
                        "regionCode"
                    );
 
 
                MessageToast.show(
                    "Selected Region: " +
                    sRegionCode
                );
 
            },
 
 
            // =========================================================
            // FILTER
            // =========================================================
 
            onFilter: function () {
 
                const aFilters = [];
 
 
                // =====================================================
                // REGION CODE
                // =====================================================
 
                const sRegionCode =
                    this.byId("regionCodeFilter")
                        .getSelectedKey();
 
 
                // =====================================================
                // REGION NAME
                // =====================================================
 
                const sRegionName =
                    this.byId("regionNameFilter")
                        .getSelectedKey();
 
 
                // =====================================================
                // RTO BASIS
                // =====================================================
 
                const sRtoBasis =
                    this.byId("rtoBasisFilter")
                        .getSelectedKey();
 
 
                // =====================================================
                // REGION CODE FILTER
                // =====================================================
 
                if (sRegionCode) {
 
                    aFilters.push(
                        new Filter(
                            "regionCode",
                            FilterOperator.EQ,
                            sRegionCode
                        )
                    );
 
                }
 
 
                // =====================================================
                // REGION NAME FILTER
                // =====================================================
 
                if (sRegionName) {
 
                    aFilters.push(
                        new Filter(
                            "regionName",
                            FilterOperator.EQ,
                            sRegionName
                        )
                    );
 
                }
 
 
                // =====================================================
                // RTO BASIS FILTER
                // =====================================================
 
                if (sRtoBasis) {
 
                    aFilters.push(
                        new Filter(
                            "rtoBasis",
                            FilterOperator.EQ,
                            sRtoBasis
                        )
                    );
 
                }
 
 
                // =====================================================
                // APPLY FILTER
                // =====================================================
 
                const oTable =
                    this.byId("regionTable");
 
 
                const oBinding =
                    oTable.getBinding("items");
 
 
                if (oBinding) {
 
                    oBinding.filter(
                        aFilters
                    );
 
                }
 
 
                // =====================================================
                // MESSAGE
                // =====================================================
 
                if (aFilters.length === 0) {
 
                    MessageToast.show(
                        "All filters cleared."
                    );
 
                }
                else {
 
                    MessageToast.show(
                        "Filter applied."
                    );
 
                }
 
            },
 
 
            // =========================================================
            // CLEAR FILTERS
            // =========================================================
 
            onClearFilters: function () {
 
                this.byId("regionCodeFilter")
                    .setSelectedKey("");
 
                this.byId("regionNameFilter")
                    .setSelectedKey("");
 
                this.byId("rtoBasisFilter")
                    .setSelectedKey("");
 
 
                const oTable =
                    this.byId("regionTable");
 
 
                const oBinding =
                    oTable.getBinding("items");
 
 
                if (oBinding) {
 
                    oBinding.filter([]);
 
                }
 
 
                MessageToast.show(
                    "Filters cleared."
                );
 
            },
 
 
            // =========================================================
            // ADAPT FILTERS
            // =========================================================
 
            onAdaptFilters: function () {
 
                if (this._oAdaptFilterDialog) {
 
                    this._oAdaptFilterDialog.open();
 
                    return;
 
                }
 
 
                // =====================================================
                // CHECKBOXES
                // =====================================================
 
                const oRegionCodeCheckBox =
                    new CheckBox({
 
                        text: "Region Code",
 
                        selected: true
 
                    });
 
 
                const oRegionNameCheckBox =
                    new CheckBox({
 
                        text: "Region Name",
 
                        selected: true
 
                    });
 
 
                const oRtoBasisCheckBox =
                    new CheckBox({
 
                        text: "RTO Basis",
 
                        selected: true
 
                    });
 
 
                // =====================================================
                // CONTENT
                // =====================================================
 
                const oContent =
                    new VBox({
 
                        class:
                            "sapUiMediumMargin",
 
                        items: [
 
                            new Label({
                                text:
                                    "Select filter fields"
                            }),
 
                            oRegionCodeCheckBox,
 
                            oRegionNameCheckBox,
 
                            oRtoBasisCheckBox
 
                        ]
 
                    });
 
 
                // =====================================================
                // DIALOG
                // =====================================================
 
                this._oAdaptFilterDialog =
                    new Dialog({
 
                        title:
                            "Adapt Filters",
 
                        contentWidth:
                            "350px",
 
                        content:
                            [oContent],
 
                        beginButton:
                            new Button({
 
                                text:
                                    "Apply",
 
                                type:
                                    "Emphasized",
 
                                press:
                                    function () {
 
                                        this
                                            .byId(
                                                "regionCodeFilter"
                                            )
                                            .setVisible(
                                                oRegionCodeCheckBox
                                                    .getSelected()
                                            );
 
 
                                        this
                                            .byId(
                                                "regionNameFilter"
                                            )
                                            .setVisible(
                                                oRegionNameCheckBox
                                                    .getSelected()
                                            );
 
 
                                        this
                                            .byId(
                                                "rtoBasisFilter"
                                            )
                                            .setVisible(
                                                oRtoBasisCheckBox
                                                    .getSelected()
                                            );
 
 
                                        this
                                            ._oAdaptFilterDialog
                                            .close();
 
                                    }.bind(this)
 
                            }),
 
                        endButton:
                            new Button({
 
                                text:
                                    "Cancel",
 
                                press:
                                    function () {
 
                                        this
                                            ._oAdaptFilterDialog
                                            .close();
 
                                    }.bind(this)
 
                            })
 
                    });
 
 
                // =====================================================
                // ADD DIALOG TO VIEW
                // =====================================================
 
                this.getView()
                    .addDependent(
                        this._oAdaptFilterDialog
                    );
 
 
                this._oAdaptFilterDialog.open();
 
            },
 
 
            // =========================================================
            // LOAD FILTER VALUES
            // =========================================================
 
            _loadFilterValues: function () {
 
                const oModel =
                    this.getView()
                        .getModel();
 
 
                if (!oModel) {
                    return;
                }
 
 
                const oBinding =
                    oModel.bindList(
                        "/Regions"
                    );
 
 
                oBinding
                    .requestContexts(0, 1000)
                    .then(function (aContexts) {
 
                        const aRegions =
                            aContexts.map(
                                function (oContext) {
                                    return oContext.getObject();
                                }
                            );
 
 
                        const aRegionCodes = [];
                        const aRegionNames = [];
                        const aRtoBasis = [];
 
 
                        aRegions.forEach(
                            function (oRegion) {
 
 
                                // -------------------------------------
                                // REGION CODE
                                // -------------------------------------
 
                                if (
                                    oRegion.regionCode &&
                                    !aRegionCodes.some(
                                        function (oItem) {
 
                                            return (
                                                oItem.key ===
                                                oRegion.regionCode
                                            );
 
                                        }
                                    )
                                ) {
 
                                    aRegionCodes.push({
 
                                        key:
                                            oRegion.regionCode,
 
                                        text:
                                            oRegion.regionCode
 
                                    });
 
                                }
 
 
                                // -------------------------------------
                                // REGION NAME
                                // -------------------------------------
 
                                if (
                                    oRegion.regionName &&
                                    !aRegionNames.some(
                                        function (oItem) {
 
                                            return (
                                                oItem.key ===
                                                oRegion.regionName
                                            );
 
                                        }
                                    )
                                ) {
 
                                    aRegionNames.push({
 
                                        key:
                                            oRegion.regionName,
 
                                        text:
                                            oRegion.regionName
 
                                    });
 
                                }
 
 
                                // -------------------------------------
                                // RTO BASIS
                                // -------------------------------------
 
                                if (
                                    oRegion.rtoBasis &&
                                    !aRtoBasis.some(
                                        function (oItem) {
 
                                            return (
                                                oItem.key ===
                                                oRegion.rtoBasis
                                            );
 
                                        }
                                    )
                                ) {
 
                                    aRtoBasis.push({
 
                                        key:
                                            oRegion.rtoBasis,
 
                                        text:
                                            oRegion.rtoBasis
 
                                    });
 
                                }
 
                            }
                        );
 
 
                        const oFilterModel =
                            new JSONModel({
 
                                regionCodes:
                                    aRegionCodes,
 
                                regionNames:
                                    aRegionNames,
 
                                rtoBasis:
                                    aRtoBasis
 
                            });
 
 
                        this.getView()
                            .setModel(
                                oFilterModel,
                                "filter"
                            );
 
                    }.bind(this))
 
                    .catch(function () {
 
                        MessageBox.error(
                            "Failed to load filter values."
                        );
 
                    });
 
            },
 
 
            // =========================================================
            // EXIT
            // =========================================================
 
            onExit: function () {
 
                if (this._oAdaptFilterDialog) {
 
                    this._oAdaptFilterDialog.destroy();
 
                    this._oAdaptFilterDialog = null;
 
                }
 
            }
 
        }
    );
});