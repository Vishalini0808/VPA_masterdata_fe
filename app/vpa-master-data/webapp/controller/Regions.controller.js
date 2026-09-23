sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (
    Controller,
    MessageToast,
    MessageBox
) {
    "use strict";

    return Controller.extend(
        "vpamasterdata.controller.Regions",
        {

            onNavBack: function () {

                this.getOwnerComponent()
                    .getRouter()
                    .navTo("RouteView1");

            },


            onAdd: function () {

                this.byId("regionCodeInput").setValue("");
                this.byId("regionNameInput").setValue("");
                this.byId("rtoBasisInput").setValue("");

                this.byId("regionCodeInput").setEditable(true);

                this.byId("regionDialog").setTitle("Add Region");

                this.byId("regionDialog").open();

            },


            onCancel: function () {

                this.byId("regionDialog").close();

            },

            onEdit: function (oEvent) {

                const oContext = oEvent.getSource().getBindingContext();

                this._oEditContext = oContext;

                this.byId("regionCodeInput").setValue(oContext.getProperty("regionCode"));

                this.byId("regionNameInput").setValue(oContext.getProperty("regionName") || "");

                this.byId("rtoBasisInput").setValue(oContext.getProperty("rtoBasis") || "");

                // key should not be changed:
                this.byId("regionCodeInput").setEditable(false);

                this.byId("regionDialog").setTitle("Edit Region");

                this.byId("regionDialog").open();

            },


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


                if (!sRegionCode) {

                    MessageBox.error(
                        "Region Code is required."
                    );

                    return;
                }


                try {

                    // EDIT
                    if (this._oEditContext) {

                        this._oEditContext.setProperty(
                            "regionName",
                            sRegionName
                        );

                        this._oEditContext.setProperty(
                            "rtoBasis",
                            sRtoBasis
                        );

                        await this._oEditContext
                            .requestObject();

                        MessageToast.show(
                            "Region updated successfully."
                        );

                    }

                    // CREATE
                    else {

                        const oModel =
                            this.getView().getModel();

                        const oListBinding =
                            oModel.bindList("/Regions");

                        await oListBinding
                            .create({
                                regionCode: sRegionCode,
                                regionName: sRegionName,
                                rtoBasis: sRtoBasis
                            })
                            .created();

                        MessageToast.show(
                            "Region created successfully."
                        );
                    }


                    this.byId("regionDialog").close();

                    this._oEditContext = null;

                }
                catch (oError) {

                    console.error(oError);

                    MessageBox.error(
                        "Failed to save Region."
                    );

                }
            },

            onDelete: async function (oEvent) {

                const oContext =
                    oEvent.getSource()
                        .getBindingContext();

                const sRegionCode =
                    oContext.getProperty("regionCode");

                MessageBox.confirm(
                    "Do you want to delete Region " + sRegionCode + "?",
                    {
                        title: "Delete Region",

                        onClose: async function (sAction) {

                            if (sAction !== MessageBox.Action.OK) {
                                return;
                            }

                            try {

                                await oContext.delete();

                                MessageToast.show(
                                    "Region deleted successfully."
                                );

                            }
                            catch (oError) {

                                console.error(oError);

                                MessageBox.error(
                                    "Failed to delete Region."
                                );

                            }

                        }
                    }
                );
            },

        }
    );
});