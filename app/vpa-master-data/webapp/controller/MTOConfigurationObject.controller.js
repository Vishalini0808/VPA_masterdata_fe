sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/format/NumberFormat",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, NumberFormat, MessageToast, MessageBox) {
    "use strict";

    const GROUP = "partsGroup";

    return Controller.extend("vpamasterdata.controller.MTOConfigurationObject", {

        // ---------------- Init ----------------

        onInit: function () {
            this.getView().setModel(new JSONModel({ grandTotal: "0.00" }), "viewModel");
            this.getView().setModel(new JSONModel({}), "partsLookup");
            this._loadPartsLookup();

            this.getOwnerComponent()
                .getRouter()
                .getRoute("MTOConfigurationObject")
                .attachPatternMatched(this._onObjectMatched, this);

        },

        // Local copy of all Parts, keyed by partCode, used to fill the row on selection
        _loadPartsLookup: function () {
            const oModel = this.getOwnerComponent().getModel();
            oModel.bindList("/Parts").requestContexts(0, 5000).then((aContexts) => {
                const mParts = {};
                aContexts.forEach((oCtx) => {
                    const oPart = oCtx.getObject();
                    mParts[oPart.partCode] = oPart;
                });
                this.getView().getModel("partsLookup").setData(mParts);

                this._recalcTotal()

            }).catch((oError) => console.error("Parts lookup failed", oError));
        },

        _onObjectMatched: function (oEvent) {
            const sCode = decodeURIComponent(oEvent.getParameter("arguments").mtoModelCode);
            this.getView().bindElement({
                path: "/MTOConfigurations('" + sCode + "')"
            });
        },

        // ---------------- Formatters ----------------

        _partField: function (sCode, mParts, sField) {
            return (sCode && mParts && mParts[sCode]) ? mParts[sCode][sField] : "";
        },
        fmtDescription: function (c, m) { return this._partField(c, m, "description"); },
        fmtMiyCost: function (c, m) { return this._partField(c, m, "miyCost"); },
        fmtMiyMarkup: function (c, m) { return this._partField(c, m, "miyMarkup"); },
        fmtPriceIndicator: function (c, m) { return this._partField(c, m, "priceIndicator"); },


        // ---------------- Amount calculation ----------------
        _fmtAmount: function (fValue) {
            return NumberFormat.getFloatInstance({
                minFractionDigits: 2,
                maxFractionDigits: 2
            }).format(fValue);
        },

        // Decimals arrive from OData V4 as strings, so parse them
        _unit: function (sCode, mParts) {
            const oPart = (sCode && mParts) ? mParts[sCode] : null;
            if (!oPart) { return 0; }
            return (parseFloat(oPart.miyCost) || 0) + (parseFloat(oPart.miyMarkup) || 0);
        },

        _lineTotal: function (sCode, iQty, mParts) {
            return this._unit(sCode, mParts) * (Number(iQty) || 0);
        },

        fmtUnitPrice: function (sCode, mParts) {
            return this._fmtAmount(this._unit(sCode, mParts));
        },

        fmtLineTotal: function (sCode, iQty, mParts) {
            return this._fmtAmount(this._lineTotal(sCode, iQty, mParts));
        },

        _recalcTotal: function () {
            const oBinding = this.byId("mtoPartsTable").getBinding("items");
            if (!oBinding) { return; }
            const mParts = this.getView().getModel("partsLookup").getData();
            let fTotal = 0;
            oBinding.getAllCurrentContexts().forEach((oCtx) => {
                if (oCtx.isInactive()) { return; }
                fTotal += this._lineTotal(
                    oCtx.getProperty("part_partCode"),
                    oCtx.getProperty("quantity"),
                    mParts
                );
            });
            this.getView().getModel("viewModel").setProperty("/grandTotal", this._fmtAmount(fTotal));
        },

        onQuantityChange: function () { this._recalcTotal(); },
        onTableUpdateFinished: function () { this._recalcTotal(); },

        // ---------------- Header actions ----------------

        onEdit: function () {
            MessageToast.show("Edit configuration");
        },

        onDelete: function () {
            const oContext = this.getView().getBindingContext();
            if (!oContext) {
                MessageToast.show("Configuration not found");
                return;
            }
            MessageBox.confirm("Do you want to delete this MTO configuration?", {
                title: "Delete Configuration",
                onClose: async (sAction) => {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    try {
                        await oContext.delete("$auto");
                        MessageToast.show("Configuration deleted");
                        this.getOwnerComponent().getRouter().navTo("mtoConfigurations");
                    } catch (oError) {
                        console.error(oError);
                        MessageBox.error("Failed to delete configuration");
                    }
                }
            });
        },

        // ---------------- Parts ----------------

        onAddPart: function () {
            const oBinding = this.byId("mtoPartsTable").getBinding("items");

            const aContexts = oBinding.getAllCurrentContexts();

            let iNextPartNo = 1;

            aContexts.forEach(function (oContext) {
                if (oContext.isInactive()) {
                    return;
                }

                const iPartNo = Number(oContext.getProperty("partNo"));

                if (!isNaN(iPartNo) && iPartNo >= iNextPartNo) {
                    iNextPartNo = iPartNo + 1;
                }
            });

            oBinding.create(
                {
                    partNo: iNextPartNo,
                    quantity: 1
                },
                true,
                false,
                true
            );
        },

        onPartChange: function (oEvent) {
            const oCombo = oEvent.getSource();
            const oItem = oCombo.getSelectedItem();
            const oContext = oCombo.getBindingContext();
            if (!oItem || !oContext) { return; }
            // activates a new row; the other fields appear via the lookup model
            oContext.setProperty("part_partCode", oItem.getKey());

            this._recalcTotal()
        },

        onSaveParts: async function () {
            const oModel = this.getView().getModel();
            const oBinding = this.byId("mtoPartsTable").getBinding("items");

            if (!oModel.hasPendingChanges(GROUP)) {
                MessageToast.show("No changes to save");
                return;
            }

            // validate rows that will actually be sent
            for (const oCtx of oBinding.getAllCurrentContexts()) {
                if (oCtx.isInactive()) { continue; }
                if (!oCtx.getProperty("part_partCode")) {
                    MessageBox.error("Please select a part in every row");
                    return;
                }
                if (!(Number(oCtx.getProperty("quantity")) > 0)) {
                    MessageBox.error("Quantity must be greater than 0");
                    return;
                }
            }

            try {
                await oModel.submitBatch(GROUP);
            } catch (oError) {
                console.error(oError);
            }

            // if anything is still pending, the server rejected it
            if (oModel.hasPendingChanges(GROUP)) {
                MessageBox.error(
                    "Save failed. Check the server log or the response in the Network tab.",
                    { details: "The 500 comes from the backend, not the UI." }
                );
                return;
            }

            MessageToast.show("Parts saved");
            this._recalcTotal();
        },

        onCancelParts: function () {
            this.getView().getModel().resetChanges(GROUP);
            MessageToast.show("Changes discarded");

            this._recalcTotal();
        },

        onDeletePart: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            if (!oContext) {
                MessageToast.show("Part not found");
                return;
            }

            // unsaved row: just discard it
            if (oContext.isInactive() || oContext.isTransient()) {
                oContext.delete().catch(() => { /* cancelled create */ }).finally(() => this._recalcTotal());
                return;
            }

            const sPart = oContext.getProperty("part_partCode") || "";
            MessageBox.confirm("Delete part " + sPart + " from this MTO configuration?", {
                title: "Delete Part",
                onClose: async (sAction) => {
                    if (sAction !== MessageBox.Action.OK) { return; }
                    try {
                        // "$auto" so the delete happens now, not when Save is pressed
                        await oContext.delete("$auto");
                        MessageToast.show("Part deleted");

                        this._recalcTotal();

                    } catch (oError) {
                        console.error(oError);
                        MessageBox.error("Failed to delete part");
                    }
                }
            });
        }
    });
});