sap.ui.jsview("view.whitelist", {
    // ./view/whitelist.view.js
	getControllerName : function() {
		return "view.whitelist"; // ./view/whitelist.view.js
	},

	createContent : function(oController) {
		// console.log("get into whitelist.view.js: createContent");
		var oTable = new sap.ui.table.Table({
			id: "viewlisttable",
			title: "Hackday: all whitelist tickets",
			visibleRowCount: 20,
			noDataText: 'loading...'
		});

		var oColumn = new sap.ui.table.Column({
			label: new sap.ui.commons.Label({text: "Key"}),
			template: new sap.ui.commons.Link().bindProperty("text", "key").bindProperty("href", "href")
							.bindProperty("target", "_blank"),  // why this(open in new tab) is not working???
			sortProperty: "key",
			filterProperty: "key"
		});
		oTable.addColumn(oColumn);

		oColumn = new sap.ui.table.Column({
			label: new sap.ui.commons.Label({text: "Summary"}),
			template: new sap.ui.commons.TextView().bindProperty("text", "summary"),
			sortProperty: "summary",
			filterProperty: "summary"
		});
		oTable.addColumn(oColumn);

		oColumn = new sap.ui.table.Column({
			label: new sap.ui.commons.Label({text: "Reporter"}),
			template: new sap.ui.commons.TextView().bindProperty("text", "reporter"),
			sortProperty: "reporter",
			filterProperty: "reporter"
		});
		oTable.addColumn(oColumn);

		oColumn = new sap.ui.table.Column({
			label: new sap.ui.commons.Label({text: "Assignee"}),
			template: new sap.ui.commons.TextView().bindProperty("text", "assignee"),
			sortProperty: "assignee",
			filterProperty: "assignee"
		});
		oTable.addColumn(oColumn);

		oColumn = new sap.ui.table.Column({
			label: new sap.ui.commons.Label({text: "Status"}),
			template: new sap.ui.commons.TextView().bindProperty("text", "status"),
			sortProperty: "status",
			filterProperty: "status"
		});
		oTable.addColumn(oColumn);

		oColumn = new sap.ui.table.Column({
			label: new sap.ui.commons.Label({text: "Created"}),
			template: new sap.ui.commons.TextView().bindProperty("text", "created"),
			sortProperty: "created",
			filterProperty: "created"
		});
		oTable.addColumn(oColumn);

		oColumn = new sap.ui.table.Column({
			label: new sap.ui.commons.Label({text: "Updated"}),
			template: new sap.ui.commons.TextView().bindProperty("text", "updated"),
			sortProperty: "updated",
			filterProperty: "updated"
		});
		oTable.addColumn(oColumn);
		return oTable;
	}

});