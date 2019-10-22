import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as $ from 'jquery';

import { HttpTestService } from '../../../services/http.service';
import { sessionServices } from '../../../services/session.services';
import { Router, ActivatedRoute } from '@angular/router';
import {Observable} from 'rxjs/Rx';
import { AppSettings } from '../../../config/settings/app-settings';
import {GridOptions} from "ag-grid/main";
	import {gridConversionComponentBale} from "../../common/gridBaleConvertion.Component";
	import {gridConversionComponentPer} from "../../common/gridPerConvertion.Component";
	import {gridPOTotPriceComponent} from "../../common/PurchaseTotalPrice.Component";
	import {gridPOPyblPriceComponent} from "../../common/PurchasePayablePrice.Component";
	import {gridDeleteComponent} from "../../common/gridRowDelete.component";
	import {gridIndentSearchLinkComponent} from "../../common/gridIndentSearchLink.Component";
	import {legacyCodeItemNameComponent} from "../../common/legacy_item.component";
	import {numericPercentageEditorComponent} from "../../editor/numaricpercentageEditor.component";
	import {numericRequiredEditorComponent} from "../../editor/numericRequiredEditor.component";

@Component({
  selector: 'app-worklist',
  templateUrl: './poApprovalDetails.component.html'
})
export class purchaseApprovalDetailsComponent implements OnInit {



	public printableSupplierData:any = "";
	public supplierDtlData : any;
	public mukams:any;
	public printableMukam:any = "";
	public printableVehicle:any = "";
	
	public sub: any;
	public requestedId: string;
	public poDetailData : any;
	public statusChangeResponsedata : any;
	
	public successMsg: string ;
	public errorMsg: string ;
	public requestedURL : any;
	public userGroupData : any = '';
	public userMenuData : any = '';
	public userSelectionMenuData : any = [];
	public sessionData: any;
	public prefix : string = '';
	
	public approvalLevel : number = 0;
	
	public allVehicles : any = 0;
	
	public gridOptions: GridOptions;
	public hideCol: boolean = true;
	
	
	
	
	public totJuteQuantity : number = 0;
	
	public columnDef : any = [
		{headerName: "status", field: "status", hide:true, filter:"text"},
		{headerName: "Item Group", field: "itemGroup.name", suppressMenu: true, minWidth : 350},
		{headerName: "Item Descrption", field: "item.name", suppressMenu: true, minWidth : 350, cellRendererFramework: legacyCodeItemNameComponent},
		{headerName: "Quality", field: "quality.name", suppressMenu: true, hide : this.hideCol, minWidth : 250},
		{headerName: "HSN Code", field: "item.hsnCode", suppressMenu: true, minWidth : 250},
		//{headerName: "Indent No.", field: "indentId", suppressMenu: true, minWidth : 250, cellRendererFramework : gridIndentSearchLinkComponent},
		{headerName: "Order Price/Item", field: "rate", suppressMenu: true, minWidth : 200, cellEditorFramework: numericRequiredEditorComponent, editable : true, valueFormatter: function (params) {
			return parseFloat(parseFloat(params.value).toFixed(2));
		}},
		{headerName: "Quantity", field: "poQuantity", suppressMenu: true, minWidth : 200, valueFormatter: function (params) {
			return parseFloat(parseFloat(params.value).toFixed(2));
		}},
		{headerName: "Unit", field: "quantityUnit.name", suppressMenu: true, minWidth : 200},
		{headerName: "Discount(%)", field: "discount", suppressMenu: true, minWidth : 250, cellEditorFramework: numericPercentageEditorComponent, editable : true, valueFormatter: function (params) {
			return (isNaN(params.value))?0:parseFloat(parseFloat(params.value).toFixed(2));
		}},
		{headerName: "Total Price", field: "poQuantity", suppressMenu: true, cellRendererFramework: gridPOTotPriceComponent, minWidth : 200, valueFormatter: function (params) {
			return parseFloat(parseFloat(params.value).toFixed(2));
		}},
		{headerName: "GST", field: "item.itemTax.gst", suppressMenu: true, minWidth : 100},
		{headerName: "Payable Price", field: "poQuantity", suppressMenu: true, cellRendererFramework: gridPOPyblPriceComponent, minWidth : 200, valueFormatter: function (params) {
			return parseFloat(parseFloat(params.value).toFixed(2));
		}},
		{headerName: "Additional Requirement", field: "additionalRequirement", suppressMenu: true, minWidth : 350},
		{headerName: "Delete", field: "", suppressMenu: true, minWidth : 80, maxWidth : 80, width : 80, cellRendererFramework: gridDeleteComponent}
	];
	
	
	public onQuickFilterChanged($event) {
        this.gridOptions.api.setQuickFilter($event.target.value);
    }
	
	public approvalData : any = [];
	public stat : string = "";
	
	
	constructor(public http: HttpTestService, public router: Router, public session: sessionServices, public activatedRoute: ActivatedRoute) {
		var self = this;
		this.prefix = AppSettings.PREFIX;
		this.gridOptions = <GridOptions>{};
		 //this.gridOptions.columnDefs = this.columnDef;
		 this.gridOptions.paginationPageSize = 5;
		 this.gridOptions.domLayout = 'autoHeight';
		 this.gridOptions.pagination = true;
		 this.gridOptions.enableFilter = true;
		 this.gridOptions.enableSorting = true;
		 this.gridOptions.enableColResize = true;
		 this.gridOptions.floatingFilter = true;
		 this.gridOptions.suppressMovableColumns = true;
		 this.gridOptions.rowHeight = 30;
		 this.gridOptions.floatingFiltersHeight = 40;
		 this.gridOptions.rowSelection = 'single';
		 this.gridOptions.showToolPanel = false;
		 this.gridOptions.onGridReady = function(params){
			 var athleteFilterComponent = params.api.getFilterInstance("status");
			athleteFilterComponent.setModel({
						type:'equals',
						filter:'1'
						});
			params.api.onFilterChanged()
    };
		 this.gridOptions.onRowClicked = function(params) {
			 var clickedItem = $(params.event.target).attr("data-action-type");
			 //var typeofTarget = $(clickedItem.getAttribute("data-action-type");
			 if(clickedItem == "remove"){self.deleteItem(params.node.id)}
		 };
		 this.gridOptions.onCellEditingStopped = function(params) {
			 
		var totPrice = 0;
		var totTax = 0;
		self.totJuteQuantity = 0;
		for(var i = 0; i < self.poDetailData.poItemList.length; i++){
			if(self.poDetailData.poItemList[i].status != "4"){
			self.poDetailData.poItemList[i].discount = ( isNaN(self.poDetailData.poItemList[i].discount))?0:parseFloat(parseFloat(self.poDetailData.poItemList[i].discount).toFixed(2));
			self.poDetailData.poItemList[i].valueWithoutTax = (self.poDetailData.poItemList[i].poQuantity * self.poDetailData.poItemList[i].rate) - (self.poDetailData.poItemList[i].poQuantity * self.poDetailData.poItemList[i].rate * (self.poDetailData.poItemList[i].discount/100));
			self.poDetailData.poItemList[i].tax = (self.poDetailData.poItemList[i].valueWithoutTax * self.poDetailData.poItemList[i].item.itemTax.gst)/100;
			totPrice = totPrice + self.poDetailData.poItemList[i].valueWithoutTax;
			totTax = totTax + self.poDetailData.poItemList[i].tax;
			self.totJuteQuantity = self.totJuteQuantity + self.poDetailData.poItemList[i].poQuantity;
			}
		}
		
		self.poDetailData.poHeader.valueWithoutTax = totPrice - (totPrice * (self.poDetailData.poHeader.discount/100));
		self.poDetailData.poHeader.tax = totTax;
		self.poDetailData.poHeader.valueWithTax = self.poDetailData.poHeader.valueWithoutTax + totTax;
			 
			 
			 params.api.setRowData(self.poDetailData.poItemList);
			  var athleteFilterComponent = params.api.getFilterInstance("status");
			athleteFilterComponent.setModel({
						type:'equals',
						filter:'1'
						});
			params.api.onFilterChanged()
		};
	}
		
	ngOnInit() {
		this.getSession();
		this.loadApprovalData();
		//this.getUserGroup();
		this.sub = this.activatedRoute.params.subscribe(params => {
			this.requestedId = params['id'];
		});
		this.loadPODetails();
	}
	
	
	//get session details
	getSession = function(){
		this.sessionData = this.session.getSessionDetails();
	}
	
	loadApprovalData = function(){
		var self = this;
		
		this.http.getApprovalData(this.sessionData.sessionId)
			.subscribe(
			(data) => {
				self.approvalData = data;
			},
			(error) => {
				self.approvalData = [], 
				self.errorMsg = "Service Error."
				},
			() => {
				if(self.approvalData.length == 0){
					self.poDetailData = "notauth";
				}else{
				for(var i = 0; i<self.approvalData.length; i++){
					if(self.approvalData[i].taskDesc == "PO" && !self.requestedId.startsWith("J_")){
						if(self.approvalData[i].user1 && self.approvalData[i].user1.id == self.sessionData.sessionId){
							self.approvalLevel = 1;
							this.loadPODetails();
							if(!self.approvalData[i].user2){
								self.stat = "3";
							}else{
								self.stat = "17";
							}
						}else if(self.approvalData[i].user2 && self.approvalData[i].user2.id == self.sessionData.sessionId){
							self.approvalLevel = 2;
							this.loadPODetails();
							if(!self.approvalData[i].user3){
								self.stat = "3";
							}else{
								self.stat = "18";
							}
						}else if(self.approvalData[i].user3 && self.approvalData[i].user3.id == self.sessionData.sessionId){
							self.approvalLevel = 3;
							this.loadPODetails();
							if(!self.approvalData[i].user4){
								self.stat = "3";
							}else{
								self.stat = "19";
							}
						}else if(self.approvalData[i].user4 && self.approvalData[i].user4.id == self.sessionData.sessionId){
							self.approvalLevel = 4;
							this.loadPODetails();
							if(!self.approvalData[i].user5){
								self.stat = "3";
							}else{
								self.stat = "20";
							}
						}else if(self.approvalData[i].user5 && self.approvalData[i].user5.id == self.sessionData.sessionId){
							self.approvalLevel = 5;
							this.loadPODetails();
							self.stat = "3";
						}else{
							self.poDetailData = "notauth";
						}
						
					}else if(self.approvalData[i].taskDesc == "Jute PO" && self.requestedId.startsWith("J_")){
						if(self.approvalData[i].user1 && self.approvalData[i].user1.id == self.sessionData.sessionId){
							self.approvalLevel = 1;
							this.loadPODetails();
							if(!self.approvalData[i].user2){
								self.stat = "3";
							}else{
								self.stat = "17";
							}
						}else if(self.approvalData[i].user2 && self.approvalData[i].user2.id == self.sessionData.sessionId){
							self.approvalLevel = 2;
							this.loadPODetails();
							if(!self.approvalData[i].user3){
								self.stat = "3";
							}else{
								self.stat = "18";
							}
						}else if(self.approvalData[i].user3 && self.approvalData[i].user3.id == self.sessionData.sessionId){
							self.approvalLevel = 3;
							this.loadPODetails();
							if(!self.approvalData[i].user4){
								self.stat = "3";
							}else{
								self.stat = "19";
							}
						}else if(self.approvalData[i].user4 && self.approvalData[i].user4.id == self.sessionData.sessionId){
							self.approvalLevel = 4;
							this.loadPODetails();
							if(!self.approvalData[i].user5){
								self.stat = "3";
							}else{
								self.stat = "20";
							}
						}else if(self.approvalData[i].user5 && self.approvalData[i].user5.id == self.sessionData.sessionId){
							self.approvalLevel = 5;
							this.loadPODetails();
							self.stat = "3";
						}else{
							self.poDetailData = "notauth";
						}
						
					}
				}
				}
			}
		);
	}
	
	//get menu items by user group
	getMenuItemsByUserGroup = function(){ 
		var self = this;
		
		
		self.http.getSubMenuByUserGroup(self.userGroupData[0].userGroup.id)
			.subscribe(
				(data) => {
					this.userMenuData = data;
				},
				(error) => {
					this.errorMsg = error
				},
				() => {
					for(var i = 0; i < this.userMenuData.length; i++){
						if(this.userMenuData[i].menuItem.menuName == 'Purchase'){
							self.userSelectionMenuData.push(this.userMenuData[i]);
						}
						
					}
				}
			);
		
	}
	
	//get user group details
	
	getUserGroup = function(){
		this.http.getUserGroupById(this.sessionData.sessionId)
		  .subscribe(
			(data) => {
			  this.userGroupData = data;
			  },
			(error) => {
				this.errorMsg = error;
				this.userGroupData = "";
			},
			() => this.getMenuItemsByUserGroup()
		  );
	}
	
	//routing based on 
	routeSelection(e){
	  var self = this;
	  var requestedId = e.target.value;
	  
	  this.http.getRouteURL(requestedId)
			.subscribe(
			(data) => {
				self.requestedURL = data;
			},
			(error) => {self.errorMsg = error},
			() => {
				self.router.navigate([self.requestedURL.url]);
			}
		);
	}
	
	loadPODetails = function() {
		var self = this;
		this.http.getPOData(self.requestedId)
			.subscribe(
			(data) => {
				self.poDetailData = data;
			},
			(error) => self.errorMsg = error,
			() => {
				if(self.poDetailData && self.poDetailData != 'undefined'){
						this.getSupplierDetails();
				}
				self.totJuteQuantity = 0;
				for(var i=0; i<self.poDetailData.poItemList.length; i++){
					if(self.poDetailData.poItemList[i].status != '4'){
						self.totJuteQuantity = self.totJuteQuantity + self.poDetailData.poItemList[i].poQuantity;
					}
					if(self.approverlevel == 1){
						self.poDetailData.poItemList[i].approverFirst = self.sessionData.sessionId;
						self.poDetailData.poItemList[i].approveFirstDate = new Date().getTime();
					}else if(self.approverlevel == 2){
						self.poDetailData.poItemList[i].approverSecond = self.sessionData.sessionId;
						self.poDetailData.poItemList[i].approveSecondDate = new Date().getTime();
					}
				}
				if(self.poDetailData.poHeader.type == 'J'){
					self.hideCol = false;
					if(self.poDetailData.poHeader.juteUnit == 'BALE' || self.poDetailData.poHeader.juteUnit == 'PAKA BALE' || self.poDetailData.poHeader.juteUnit == 'HALF BALE'){
						self.columnDef = [
						{headerName: "status", field: "status", hide:true, filter:"text"},
						//{headerName: "Item Group", field: "itemGroup.name", suppressMenu: true, minWidth : 350},
						{headerName: "Item Descrption", field: "item.name", suppressMenu: true, minWidth : 350, cellRendererFramework: legacyCodeItemNameComponent},
						{headerName: "Quality", field: "quality.name", suppressMenu: true, hide : this.hideCol, minWidth : 250},
						{headerName: "HSN Code", field: "item.hsnCode", suppressMenu: true, minWidth : 250},
						//{headerName: "Indent No.", field: "indentId", suppressMenu: true, minWidth : 250, cellRendererFramework : gridIndentSearchLinkComponent, hide:true},
						{headerName: "Price/Item", field: "", suppressMenu: true, minWidth : 200, valueFormatter: function (params) {
						return  parseFloat(parseFloat(params.data.quality.rate).toFixed(2));
						}},
						{headerName: "Order Price/Item", field: "rate", suppressMenu: true, minWidth : 200, cellEditorFramework: numericRequiredEditorComponent, editable : true, valueFormatter: function (params) {
			return parseFloat(parseFloat(params.value).toFixed(2));
		}},
						{headerName: "Weight", field: "poQuantity", suppressMenu: true, minWidth : 200, valueFormatter: function (params) {
			return parseFloat(parseFloat(params.value).toFixed(2));
		}},
						{headerName: "Unit", field: "quantityUnit.name", suppressMenu: true, minWidth : 200},
						{headerName: "Allowable Moisture (%)", field: "allowableMoisturePercentage", suppressMenu: true, minWidth : 250, cellEditorFramework: numericPercentageEditorComponent, editable : true},
						{headerName: "Converted Quantity", field: "conversionQuantity", suppressMenu: true, minWidth : 250, 
							valueFormatter: function (params) {
							if(params.data.unitConversionType == "LOOSE"){	
								return  parseFloat(((params.data.poActualQuantity/self.totJuteQuantity)*100).toFixed(2)) +" %";
							}else{
								return params.value +" BALE";
							}
							}
						},
						{headerName: "Discount(%)", field: "discount", suppressMenu: true, minWidth : 250, cellEditorFramework: numericPercentageEditorComponent, editable : true, valueFormatter: function (params) {
			return (isNaN(params.value))?0:parseFloat(parseFloat(params.value).toFixed(2));
		}},
						{headerName: "Total Price", field: "poQuantity", suppressMenu: true, cellRendererFramework: gridPOTotPriceComponent, minWidth : 200, valueFormatter: function (params) {
			return parseFloat(parseFloat(params.value).toFixed(2));
		}},
						{headerName: "GST", field: "item.itemTax.gst", suppressMenu: true, minWidth : 100},
						{headerName: "Payable Price", field: "poQuantity", suppressMenu: true, cellRendererFramework: gridPOPyblPriceComponent, minWidth : 200, valueFormatter: function (params) {
			return parseFloat(parseFloat(params.value).toFixed(2));
		}},
						{headerName: "Additional Requirement", field: "additionalRequirement", suppressMenu: true, minWidth : 350},
						{headerName: "Delete", field: "", suppressMenu: true, minWidth : 80, maxWidth : 80, width : 80, cellRendererFramework: gridDeleteComponent}
					];
					}else{
						self.columnDef = [
						{headerName: "status", field: "status", hide:true, filter:"text"},
						{headerName: "Item Group", field: "itemGroup.name", suppressMenu: true, minWidth : 350},
						{headerName: "Item Descrption", field: "item.name", suppressMenu: true, minWidth : 350, cellRendererFramework: legacyCodeItemNameComponent},
						{headerName: "Quality", field: "quality.name", suppressMenu: true, hide : this.hideCol, minWidth : 250},
						{headerName: "HSN Code", field: "item.hsnCode", suppressMenu: true, minWidth : 250},
						//{headerName: "Indent No.", field: "indentId", suppressMenu: true, minWidth : 250, cellRendererFramework : gridIndentSearchLinkComponent, hide:true},
						{headerName: "Price/Item", field: "", suppressMenu: true, minWidth : 200, valueFormatter: function (params) {
						return  parseFloat(parseFloat(params.data.quality.rate).toFixed(2));
						}},
						{headerName: "Order Price/Item", field: "rate", suppressMenu: true, minWidth : 200, cellEditorFramework: numericRequiredEditorComponent, editable : true, valueFormatter: function (params) {
			return parseFloat(parseFloat(params.value).toFixed(2));
		}},
						{headerName: "Weight", field: "poQuantity", suppressMenu: true, minWidth : 200, valueFormatter: function (params) {
			return parseFloat(parseFloat(params.value).toFixed(2));
		}},
						{headerName: "Unit", field: "quantityUnit.name", suppressMenu: true, minWidth : 200},
						//{headerName: "Allowable Moisture (%)", field: "allowableMoisturePercentage", suppressMenu: true, minWidth : 250, cellEditorFramework: numericPercentageEditorComponent, editable : true},
						{headerName: "Converted Quantity", field: "conversionQuantity", suppressMenu: true, minWidth : 250, 
							valueFormatter: function (params) {
							if(params.data.unitConversionType == "LOOSE"){	
								return  parseFloat(((params.data.poActualQuantity/self.totJuteQuantity)*100).toFixed(2)) +" %";
							}else{
								return params.value +" BALE";
							}
							}
						},
						{headerName: "Discount(%)", field: "discount", suppressMenu: true, minWidth : 250, cellEditorFramework: numericPercentageEditorComponent, editable : true, valueFormatter: function (params) {
			return (isNaN(params.value))?0:parseFloat(parseFloat(params.value).toFixed(2));
		}},
						{headerName: "Total Price", field: "poQuantity", suppressMenu: true, cellRendererFramework: gridPOTotPriceComponent, minWidth : 200, valueFormatter: function (params) {
			return parseFloat(parseFloat(params.value).toFixed(2));
		}},
						{headerName: "GST", field: "item.itemTax.gst", suppressMenu: true, minWidth : 100},
						{headerName: "Payable Price", field: "poQuantity", suppressMenu: true, cellRendererFramework: gridPOPyblPriceComponent, minWidth : 200, valueFormatter: function (params) {
			return parseFloat(parseFloat(params.value).toFixed(2));
		}},
						{headerName: "Additional Requirement", field: "additionalRequirement", suppressMenu: true, minWidth : 350},
						{headerName: "Delete", field: "", suppressMenu: true, minWidth : 80, maxWidth : 80, width : 80, cellRendererFramework: gridDeleteComponent}
					];
					}
					
				}
			}
		);
	}
	
	updateQuantity = function(e, indexId){
		var self = this;
		var elementObjVal = e.target.value;
		self.poDetailData.poItemList[indexId].poQuantity = elementObjVal;
		
	}
	
	updateOrderVal = function(e, indexId){
		var self = this;
		var elementObjVal = e.target.value;
		self.poDetailData.poItemList[indexId].valueWithoutTax = elementObjVal;
		
	}
	
	statusChange = function(changedstatus){
		$("#page_loader_service").fadeIn();
		var self = this;
		self.poDetailData.poHeader.status = changedstatus;
		
		var totPrice = 0;
		var totTax = 0;
		for(var i = 0; i < self.poDetailData.poItemList.length; i++){
			if(self.poDetailData.poItemList[i].status != "4"){
			self.poDetailData.poItemList[i].discount = ( isNaN(self.poDetailData.poItemList[i].discount))?0:parseFloat(parseFloat(self.poDetailData.poItemList[i].discount).toFixed(2));
			self.poDetailData.poItemList[i].valueWithoutTax = (self.poDetailData.poItemList[i].poQuantity * self.poDetailData.poItemList[i].rate) - (self.poDetailData.poItemList[i].poQuantity * self.poDetailData.poItemList[i].rate * (self.poDetailData.poItemList[i].discount/100));
			self.poDetailData.poItemList[i].tax = (self.poDetailData.poItemList[i].valueWithoutTax * self.poDetailData.poItemList[i].item.itemTax.gst)/100;
			totPrice = totPrice + self.poDetailData.poItemList[i].valueWithoutTax;
			totTax = totTax + self.poDetailData.poItemList[i].tax;
			
			}
		}
		
		self.poDetailData.poHeader.valueWithoutTax = totPrice - (totPrice * (self.poDetailData.poHeader.discount/100));
		self.poDetailData.poHeader.tax = totTax;
		self.poDetailData.poHeader.valueWithTax = self.poDetailData.poHeader.valueWithoutTax + totTax;
		//self.indentDetailData.reason = self.indentCreateModel.rejectionReason;
		this.http.updatePO(self.poDetailData)
			.subscribe(
			(data) => {
				self.statusChangeResponsedata = data;
			},
			(error) => self.errorMsg = error,
			() => {
				self.successMsg = "Purchase Order Status Changed Successfully.";
				$("#page_loader_service").fadeOut();
				if(self.poDetailData.poHeader.type == 'J'){
					self.router.navigate(['jute/jutePOworklist'])
				}else{
					self.router.navigate(['purchase/worklist'])
				}
				
			}
		);
		$('.closeDialog').click();
	}
	
	deleteItem = function(indexdId){
		var self = this;
		self.poDetailData.poItemList[indexdId].status='4';
		
		var totPrice = 0;
		var totTax = 0;
		self.totJuteQuantity = 0;
		for(var i = 0; i < self.poDetailData.poItemList.length; i++){
			if(self.poDetailData.poItemList[i].status != "4"){
			self.poDetailData.poItemList[i].discount = ( isNaN(self.poDetailData.poItemList[i].discount))?0:parseFloat(parseFloat(self.poDetailData.poItemList[i].discount).toFixed(2));
			self.poDetailData.poItemList[i].valueWithoutTax = (self.poDetailData.poItemList[i].poQuantity * self.poDetailData.poItemList[i].rate) - (self.poDetailData.poItemList[i].poQuantity * self.poDetailData.poItemList[i].rate * (self.poDetailData.poItemList[i].discount/100));
			self.poDetailData.poItemList[i].tax = (self.poDetailData.poItemList[i].valueWithoutTax * self.poDetailData.poItemList[i].item.itemTax.gst)/100;
			totPrice = totPrice + self.poDetailData.poItemList[i].valueWithoutTax;
			totTax = totTax + self.poDetailData.poItemList[i].tax;
			self.totJuteQuantity = self.totJuteQuantity + self.poDetailData.poItemList[i].poQuantity;
			}
		}
		
		self.poDetailData.poHeader.valueWithoutTax = totPrice - (totPrice * (self.poDetailData.poHeader.discount/100));
		self.poDetailData.poHeader.tax = totTax;
		self.poDetailData.poHeader.valueWithTax = self.poDetailData.poHeader.valueWithoutTax + totTax;
		
		this.gridOptions.api.setRowData(self.poDetailData.poItemList);
		var athleteFilterComponent = this.gridOptions.api.getFilterInstance("status");
		athleteFilterComponent.setModel({
						type:'equals',
						filter:'1'
						});
			this.gridOptions.api.onFilterChanged();
			console.log(self.poDetailData);
	}
	getSupplierDetails = function(){
		
		var self = this;
		this.http.getAllSuppliers()
			.subscribe(
			(data) => {
				self.supplierDtlData = data;
				console.log(self.supplierDtlData);
			},
			(error) => self.errorMsg = error,
			() => {
				for(var i=0; i < self.supplierDtlData.length; i++){
					if(self.supplierDtlData[i].id == self.poDetailData.poHeader.supplierId){
					self.printableSupplierData = self.supplierDtlData[i];
					}
				}
				
				if(self.poDetailData.poHeader.type == 'J'){
						self.loadMukam(self.printableSupplierData.id);
				}
			}
		);
	}

	loadMukam = function(supplier){
		var self = this;
		  this.http.getAllMukamsbysup(supplier)
			.subscribe(
			  (data) => {
				this.mukams = data;
				},
			  (error) => {
				  this.errorMsg = error;
				  this.mukams = "";
			  },
			  () => {
				  
				  for(var i=0; i < self.mukams.length; i++){
					  if(self.mukams[i].mukamId == self.poDetailData.poHeader.mukam){
					  self.printableMukam = self.mukams[i];
					  }
				  }
				  if(self.poDetailData.poHeader.type == 'J'){
						self.getAllVehicles();
					}
				//   self.getAllVehicles();
			  }
			);
	}
	
	//get all vehicles
	getAllVehicles = function(){
		var self = this;
		this.http.getAllVehicles()
		  .subscribe(
			(data) => {
			  this.allVehicles = data;
			  },
			(error) => {
				this.errorMsg = error;
				this.allVehicles = "";
			},
			() => {
				for(var i=0; i < self.allVehicles.length; i++){
					  if(self.allVehicles[i].id == self.poDetailData.poHeader.vehicleTypeId){
					  self.printableVehicle = self.allVehicles[i];
					  }
				  }
				
			}
		  );
	}

}
