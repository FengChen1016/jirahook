sap.ui.controller("view.whitelist", {
	// ./view/whitelist.controller.js
	onInit: function() {
		console.log("get into whitelist.controller.js: onInit");
		$.ajax({
			url: "./api/openticket"
		}).done(function(data, status, jqxhr) {
			// create model and bind data to table rows
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData({modelData: data});
			var oTable = sap.ui.getCore().byId('viewlisttable');
			oTable.setModel(oModel);
			oTable.bindRows("/modelData");
		});
	}
});