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

    // must match $$updateGroupId in the view
    const UPDATE_GROUP = "regionGroup";

    return Controller.extend(
        "vpamasterdata.controller.Regions",
        {

            // =========================================================
            // INITIALIZATION
            // =========================================================

            onInit: function () {

                // contexts of existing rows currently in edit mode
                this._aEditContexts = [];

                this._loadFilterValues();

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
            // ADD ROW (inline, replaces the old dialog)
            // =========================================================

            onAddRow: function () {

                const oBinding =
                    this.byId("regionTable")
                        .getBinding("items");

                // create(initialData, bSkipRefresh, bAtEnd)
                oBinding.create({

                    regionCode: "",

                    regionName: "",

                    rtoBasis: "",

                    status: "Draft"      // draft by default

                }, true, false);         // add at the top

            },


            // =========================================================
            // EDIT ROW (inline, existing rows)
            // =========================================================

            onEdit: function (oEvent) {

                // Button -> HBox -> ColumnListItem
                const oItem =
                    oEvent.getSource()
                        .getParent()
                        .getParent();

                const oContext =
                    oItem.getBindingContext();


                if (!oContext) {
                    return;
                }


                // new rows are already editable
                if (oContext.isTransient()) {
                    return;
                }


                // already in edit mode
                if (this._aEditContexts.indexOf(oContext) !== -1) {
                    return;
                }


                this._aEditContexts.push(oContext);

                this._toggleEditCells(oItem, true);

            },


            // Region Code (cell 0) is the key, so only
            // Region Name (1) and RTO Basis (2) become editable
            _toggleEditCells: function (oItem, bEdit) {

                const aCells = oItem.getCells();

                [1, 2].forEach(function (iIndex) {

                    const aChildren =
                        aCells[iIndex].getItems();

                    aChildren[0].setVisible(!bEdit);   // Text

                    aChildren[1].setVisible(bEdit);    // Input / ComboBox

                });

            },


            _exitEditMode: function () {

                const aItems =
                    this.byId("regionTable")
                        .getItems();

                this._aEditContexts.forEach(function (oContext) {

                    const oItem = aItems.find(function (oRow) {
                        return oRow.getBindingContext() === oContext;
                    });

                    if (oItem) {
                        this._toggleEditCells(oItem, false);
                    }

                }.bind(this));

                this._aEditContexts = [];

            },


            // =========================================================
            // SUBMIT (footer)
            // =========================================================

            onSubmit: async function () {

                const oModel =
                    this.getView()
                        .getModel();


                const aNewContexts =
                    this.byId("regionTable")
                        .getBinding("items")
                        .getAllCurrentContexts()
                        .filter(function (oContext) {
                            return oContext.isTransient();
                        });


                if (
                    aNewContexts.length === 0 &&
                    this._aEditContexts.length === 0
                ) {

                    MessageToast.show(
                        "Nothing to submit."
                    );

                    return;

                }


                // =====================================================
                // VALIDATION - new rows
                // =====================================================

                const bNewInvalid =
                    aNewContexts.some(function (oContext) {

                        return (
                            !(oContext.getProperty("regionCode") || "").trim() ||
                            !oContext.getProperty("regionName") ||
                            !oContext.getProperty("rtoBasis")
                        );

                    });


                // =====================================================
                // VALIDATION - edited rows
                // =====================================================

                const bEditInvalid =
                    this._aEditContexts.some(function (oContext) {

                        return (
                            !oContext.getProperty("regionName") ||
                            !oContext.getProperty("rtoBasis")
                        );

                    });


                if (bNewInvalid || bEditInvalid) {

                    MessageBox.error(
                        "Please fill all fields before submitting."
                    );

                    return;

                }


                // =====================================================
                // DUPLICATE REGION CODE (new rows)
                // =====================================================

                const aCodes =
                    aNewContexts.map(function (oContext) {
                        return oContext.getProperty("regionCode").trim();
                    });


                if (new Set(aCodes).size !== aCodes.length) {

                    MessageBox.error(
                        "Duplicate Region Codes found in the new rows."
                    );

                    return;

                }


                // =====================================================
                // SAVE
                // =====================================================

                this.getView().setBusy(true);


                // Draft -> Submitted (new rows and edited rows)
                const aSubmitContexts =
                    aNewContexts.concat(this._aEditContexts);

                aSubmitContexts.forEach(function (oContext) {
                    oContext.setProperty("status", "Submitted");
                });


                // put the rows back to Draft if the save fails
                const fnRevertStatus = function () {

                    aNewContexts.forEach(function (oContext) {

                        if (oContext.isTransient()) {
                            oContext.setProperty("status", "Draft");
                        }

                    });

                };


                try {

                    await oModel.submitBatch(UPDATE_GROUP);


                    // still pending => the backend rejected the request
                    if (oModel.hasPendingChanges(UPDATE_GROUP)) {

                        fnRevertStatus();

                        MessageBox.error(
                            this._getLastErrorMessage() ||
                            "Save failed. Please check the Network tab."
                        );

                        return;

                    }


                    this._exitEditMode();

                    MessageToast.show(
                        "Saved successfully."
                    );

                    // Reload filter values
                    this._loadFilterValues();

                }
                catch (oError) {

                    fnRevertStatus();

                    MessageBox.error(
                        (oError && oError.message) ||
                        "Failed to save Regions."
                    );

                }
                finally {

                    this.getView().setBusy(false);

                }

            },


            // last backend error text from the message manager
            _getLastErrorMessage: function () {

                const aMessages =
                    sap.ui.getCore()
                        .getMessageManager()
                        .getMessageModel()
                        .getData()
                        .filter(function (oMessage) {
                            return oMessage.getType() === "Error";
                        });

                return aMessages.length
                    ? aMessages[aMessages.length - 1].getMessage()
                    : "";

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


                // new, unsaved row: just discard it
                if (oContext.isTransient()) {

                    oContext.delete("$auto");

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
                                await oContext.delete("$auto");


                                // drop from edit list if it was there
                                this._aEditContexts =
                                    this._aEditContexts.filter(
                                        function (oCtx) {
                                            return oCtx !== oContext;
                                        }
                                    );


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

                const oModel =
                    this.getView()
                        .getModel();


                // V4 cannot filter while unsaved changes exist
                if (oModel.hasPendingChanges(UPDATE_GROUP)) {

                    MessageBox.warning(
                        "Please submit or delete the unsaved rows before filtering."
                    );

                    return;

                }


                const aFilters = [];


                const sRegionCode =
                    this.byId("regionCodeFilter")
                        .getSelectedKey();

                const sRegionName =
                    this.byId("regionNameFilter")
                        .getSelectedKey();

                const sRtoBasis =
                    this.byId("rtoBasisFilter")
                        .getSelectedKey();


                if (sRegionCode) {

                    aFilters.push(
                        new Filter(
                            "regionCode",
                            FilterOperator.EQ,
                            sRegionCode
                        )
                    );

                }


                if (sRegionName) {

                    aFilters.push(
                        new Filter(
                            "regionName",
                            FilterOperator.EQ,
                            sRegionName
                        )
                    );

                }


                if (sRtoBasis) {

                    aFilters.push(
                        new Filter(
                            "rtoBasis",
                            FilterOperator.EQ,
                            sRtoBasis
                        )
                    );

                }


                const oBinding =
                    this.byId("regionTable")
                        .getBinding("items");


                if (oBinding) {

                    oBinding.filter(
                        aFilters
                    );

                }


                // rows are re-rendered after filtering
                this._aEditContexts = [];


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

                const oModel =
                    this.getView()
                        .getModel();


                if (oModel.hasPendingChanges(UPDATE_GROUP)) {

                    MessageBox.warning(
                        "Please submit or delete the unsaved rows before clearing filters."
                    );

                    return;

                }


                this.byId("regionCodeFilter")
                    .setSelectedKey("");

                this.byId("regionNameFilter")
                    .setSelectedKey("");

                this.byId("rtoBasisFilter")
                    .setSelectedKey("");


                const oBinding =
                    this.byId("regionTable")
                        .getBinding("items");


                if (oBinding) {

                    oBinding.filter([]);

                }


                this._aEditContexts = [];


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

                                        this.byId("regionCodeFilter")
                                            .setVisible(
                                                oRegionCodeCheckBox.getSelected()
                                            );

                                        this.byId("regionNameFilter")
                                            .setVisible(
                                                oRegionNameCheckBox.getSelected()
                                            );

                                        this.byId("rtoBasisFilter")
                                            .setVisible(
                                                oRtoBasisCheckBox.getSelected()
                                            );

                                        this._oAdaptFilterDialog
                                            .close();

                                    }.bind(this)

                            }),

                        endButton:
                            new Button({

                                text:
                                    "Cancel",

                                press:
                                    function () {

                                        this._oAdaptFilterDialog
                                            .close();

                                    }.bind(this)

                            })

                    });


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


                        // unique key/text pairs
                        const fnAddUnique = function (aTarget, sValue) {

                            if (
                                sValue &&
                                !aTarget.some(function (oItem) {
                                    return oItem.key === sValue;
                                })
                            ) {

                                aTarget.push({
                                    key: sValue,
                                    text: sValue
                                });

                            }

                        };


                        aRegions.forEach(
                            function (oRegion) {

                                fnAddUnique(aRegionCodes, oRegion.regionCode);

                                fnAddUnique(aRegionNames, oRegion.regionName);

                                fnAddUnique(aRtoBasis, oRegion.rtoBasis);

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