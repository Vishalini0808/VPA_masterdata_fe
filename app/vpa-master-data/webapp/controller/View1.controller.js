sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {

    "use strict";

    return Controller.extend(
        "vpamasterdata.controller.View1",
        {

            onTilePress: function (oEvent) {

                const oContext =
                    oEvent.getSource()
                        .getBindingContext("tile");

                const sKey =
                    oContext.getProperty("key");

                this.getOwnerComponent()
                    .getRouter()
                    .navTo(sKey);

            }

        }
    );

});