sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {

    "use strict";

    return Controller.extend(
        "vpamasterdata.controller.RTOMasters",
        {

            onNavBack: function () {

                this.getOwnerComponent()
                    .getRouter()
                    .navTo("RouteView1");

            }

        }
    );

});