sap.ui.define([

    "sap/ui/core/mvc/Controller",

    "sap/m/MessageToast",

    "sap/m/MessageBox",

    "sap/ui/model/Filter",

    "sap/ui/model/FilterOperator",

    "sap/ui/model/FilterType",

    "sap/ui/model/json/JSONModel"

], function (Controller, MessageToast, MessageBox, Filter, FilterOperator, FilterType, JSONModel) {

    "use strict";

    // must match $$updateGroupId in the view

    const UPDATE_GROUP = "partGroup";

    // properties the service expects as null, not "", when left empty

    const EMPTY_AS_NULL = ["validFrom", "miyCost", "miyMarkup"];
    const EDITABLE_CELLS = [1, 2, 4, 5, 6];

    return Controller.extend("vpamasterdata.controller.Parts", {

        // =====================================================

        // INIT

        // =====================================================

        onInit: function () {

            // contexts of existing rows currently in edit mode

            this._aEditContexts = [];

            this.getView().setModel(new JSONModel({ count: 0 }), "viewModel");

            this.getView().setModel(

                new JSONModel({ partCodes: [], descriptions: [] }),

                "filter"

            );

            this._loadFilterValues();

        },

        onNavBack: function () {

            this.getOwnerComponent().getRouter().navTo("RouteView1");

        },

        onTableUpdateFinished: function (oEvent) {

            this.getView().getModel("viewModel")

                .setProperty("/count", oEvent.getParameter("total") || 0);

        },

        onRefresh: function () {

            if (this.getView().getModel().hasPendingChanges(UPDATE_GROUP)) {

                MessageBox.warning("Please submit or cancel the unsaved rows before refreshing.");

                return;

            }

            this._aEditContexts = [];

            this.byId("partsTable").getBinding("items").refresh();

            this._loadFilterValues();

        },

        // =====================================================

        // FILTER

        // =====================================================

        onGoFilter: function () {

            // V4 cannot filter while unsaved changes exist

            if (this.getView().getModel().hasPendingChanges(UPDATE_GROUP)) {

                MessageBox.warning("Please submit or cancel the unsaved rows before filtering.");

                return;

            }

            const aFilters = [];

            const sPartCode = this.byId("partCodeFilter").getSelectedKey();

            const sDescription = this.byId("partDescriptionFilter").getSelectedKey();

            if (sPartCode) {

                aFilters.push(new Filter("partCode", FilterOperator.EQ, sPartCode));

            }

            if (sDescription) {

                aFilters.push(new Filter("description", FilterOperator.EQ, sDescription));

            }

            this.byId("partsTable").getBinding("items").filter(aFilters, FilterType.Application);

            // rows are re-rendered after filtering

            this._aEditContexts = [];

        },

        onClearFilter: function () {

            if (this.getView().getModel().hasPendingChanges(UPDATE_GROUP)) {

                MessageBox.warning("Please submit or cancel the unsaved rows before clearing filters.");

                return;

            }

            this.byId("partCodeFilter").setSelectedKey("");

            this.byId("partDescriptionFilter").setSelectedKey("");

            this.byId("partsTable").getBinding("items").filter([], FilterType.Application);

            this._aEditContexts = [];

        },

        // unique values for the code and description dropdowns

        _loadFilterValues: function () {

            const oModel = this.getOwnerComponent().getModel();

            if (!oModel) { return; }

            oModel.bindList("/Parts", null, null, null, {

                $select: "partCode,description"

            })

                .requestContexts(0, 1000)

                .then(function (aContexts) {

                    const aParts = aContexts.map(function (oContext) {

                        return oContext.getObject();

                    });

                    const fnUnique = function (sField) {

                        return Array.from(new Set(

                            aParts.map(function (oPart) { return oPart[sField]; })

                                .filter(Boolean)

                        )).sort().map(function (sValue) {

                            return { key: sValue, text: sValue };

                        });

                    };

                    this.getView().getModel("filter").setData({

                        partCodes: fnUnique("partCode"),

                        descriptions: fnUnique("description")

                    });

                }.bind(this))

                .catch(function () {

                    MessageBox.error("Failed to load filter values.");

                });

        },

        // =====================================================

        // ADD ROW (inline)

        // =====================================================

        onAddRow: function () {

            const oBinding = this.byId("partsTable").getBinding("items");

            // create(initialData, bSkipRefresh, bAtEnd)

            oBinding.create({

                partCode: "",

                validFrom: null,

                description: "",

                approvalStatus: "DRAFT",

                miyCost: null,

                miyMarkup: null,

                priceIndicator: ""

            }, true, false);              // add at the top

        },

        // =====================================================

        // EDIT ROW (inline, existing rows)

        // =====================================================

        onEdit: function (oEvent) {

            // Button -> HBox -> ColumnListItem

            const oItem = oEvent.getSource().getParent().getParent();

            const oContext = oItem.getBindingContext();

            if (!oContext) {

                MessageBox.error("Unable to get selected part.");

                return;

            }

            if (oContext.isTransient()) { return; }                       // new rows are already editable

            const sStatus = oContext.getProperty("approvalStatus");
            if (sStatus === "SUBMITTED") {
                MessageToast.show("This part is waiting for approval and cannot be edited.");
                return;
            }

            if (this._aEditContexts.indexOf(oContext) !== -1) { return; } // already in edit mode

            this._aEditContexts.push(oContext);

            this._toggleEditCells(oItem, true);

        },

        // Part Code (cell 0) is the key, so cells 1..5 become editable


        _toggleEditCells: function (oItem, bEdit) {

            const aCells = oItem.getCells();

            EDITABLE_CELLS.forEach(function (i) {
                const aChildren = aCells[i].getItems();
                aChildren[0].setVisible(!bEdit);   // Text
                aChildren[1].setVisible(bEdit);    // Input / DatePicker
            });

        },

        _exitEditMode: function () {

            const aItems = this.byId("partsTable").getItems();

            this._aEditContexts.forEach(function (oContext) {

                const oItem = aItems.find(function (oRow) {

                    return oRow.getBindingContext() === oContext;

                });

                if (oItem) { this._toggleEditCells(oItem, false); }

            }.bind(this));

            this._aEditContexts = [];

        },

        // =====================================================

        // CANCEL (footer): discard new rows and edits

        // =====================================================

        onCancel: function () {

            const oModel = this.getView().getModel();

            if (!oModel.hasPendingChanges(UPDATE_GROUP) && this._aEditContexts.length === 0) {

                MessageToast.show("Nothing to cancel.");

                return;

            }

            oModel.resetChanges(UPDATE_GROUP);

            this._exitEditMode();

            MessageToast.show("Changes discarded.");

        },

        // =====================================================

        // SUBMIT (footer)

        // =====================================================

        onSubmit: async function () {

            const oModel = this.getView().getModel();

            const aNewContexts = this.byId("partsTable")

                .getBinding("items")

                .getAllCurrentContexts()

                .filter(function (oContext) { return oContext.isTransient(); });

            if (aNewContexts.length === 0 && this._aEditContexts.length === 0) {

                MessageToast.show("Nothing to submit.");

                return;

            }

            // ---------- validation ----------

            const bNewInvalid = aNewContexts.some(function (oContext) {

                return !(oContext.getProperty("partCode") || "").trim();

            });

            if (bNewInvalid) {

                MessageBox.error("Part Code is required.");

                return;

            }

            // duplicate Part Codes in the new rows

            const aCodes = aNewContexts.map(function (oContext) {

                return oContext.getProperty("partCode").trim();

            });

            if (new Set(aCodes).size !== aCodes.length) {

                MessageBox.error("Duplicate Part Codes found in the new rows.");

                return;

            }



            // new rows become SUBMITTED; saved rows only if the user actually changed something
            aNewContexts.forEach(function (oContext) {
                oContext.setProperty("approvalStatus", "SUBMITTED");
            });
            this._aEditContexts.forEach(function (oContext) {
                if (oContext.hasPendingChanges()) {
                    oContext.setProperty("approvalStatus", "SUBMITTED");
                }
            });

            // ---------- save ----------

            this.getView().setBusy(true);

            // cleared inputs return "", but the service expects null

            aNewContexts.concat(this._aEditContexts).forEach(function (oContext) {

                EMPTY_AS_NULL.forEach(function (sProperty) {

                    if (oContext.getProperty(sProperty) === "") {

                        oContext.setProperty(sProperty, null);

                    }

                });

            });

            try {

                await oModel.submitBatch(UPDATE_GROUP);

                // still pending => the backend rejected the request

                if (oModel.hasPendingChanges(UPDATE_GROUP)) {

                    MessageBox.error(

                        this._getLastErrorMessage() ||

                        "Save failed. Please check the Network tab."

                    );

                    return;

                }

                this._exitEditMode();

                MessageToast.show("Saved successfully.");

                this._loadFilterValues();

            }

            catch (oError) {

                MessageBox.error(

                    (oError && oError.message) || "Failed to save Parts."

                );

            }

            finally {

                this.getView().setBusy(false);

            }

        },

        // last backend error text from the message manager

        _getLastErrorMessage: function () {

            const aMessages = sap.ui.getCore()

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

        // =====================================================

        // DELETE

        // =====================================================

        onDelete: function (oEvent) {

            const oContext = oEvent.getSource().getBindingContext();

            if (!oContext) {

                MessageBox.error("Unable to get selected part.");

                return;

            }

            // new, unsaved row: just discard it

            if (oContext.isTransient()) {

                oContext.delete("$auto");

                return;

            }

            const sPartCode = oContext.getProperty("partCode");

            MessageBox.confirm("Are you sure you want to delete part " + sPartCode + "?", {

                title: "Delete Part",

                onClose: async function (sAction) {

                    if (sAction !== MessageBox.Action.OK) { return; }

                    try {

                        // "$auto" = send immediately, do not wait for Submit

                        await oContext.delete("$auto");

                        // drop from edit list if it was there

                        this._aEditContexts = this._aEditContexts.filter(function (oCtx) {

                            return oCtx !== oContext;

                        });

                        MessageToast.show("Part deleted successfully.");

                        this._loadFilterValues();

                    }

                    catch (oError) {

                        MessageBox.error(oError.message || "Failed to delete part.");

                    }

                }.bind(this)

            });

        }

    });

});
