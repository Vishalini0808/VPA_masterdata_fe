sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], function (
    Controller,
    Filter,
    FilterOperator,
    MessageToast
) {

    "use strict";

    return Controller.extend("vpamasterdata.controller.View1", {

        

        onRefresh: function () {

            const oBinding = this.byId("masterDataGrid")
                .getBinding("items");

            if (oBinding) {
                oBinding.refresh();
            }

            MessageToast.show("Master data refreshed");
        },

        onTilePress: function (oEvent) {

            const oContext = oEvent
                .getSource()
                .getBindingContext("tile");

            if (!oContext) {
                MessageToast.show("Unable to read tile information");
                return;
            }

            const sKey = oContext.getProperty("key");

            const oRouter = this
                .getOwnerComponent()
                .getRouter();

            if (!oRouter.getRoute(sKey)) {
                MessageToast.show(
                    "No route named '" + sKey + "' in manifest.json"
                );
                return;
            }

            oRouter.navTo(sKey);
        }

    });

});

