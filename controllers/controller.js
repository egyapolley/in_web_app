const soapRequest = require("easy-soap-request");
const xml2js = require("xml2js");
const utils = require("../utils/main_utils");
const uuid = require("uuid");
const parser = require('fast-xml-parser');
const he = require('he');
const moment = require("moment");
const mysql = require('mysql2');
const appData = require("../utils/appdata");
const validator = require("../utils/valiators");
const bcrypt = require("bcrypt");
const UserUUID = require("../models/userUUID");
const sendMail = require("../utils/send_mail");
const path = require("path");
const UserLog = require("../models/userlogs");

const User = require("../models/users")

require("dotenv").config({
    path: path.join(__dirname, "../config.env")
});


const options = {
    attributeNamePrefix: "@_",
    attrNodeName: "attr", //default is 'false'
    textNodeName: "#text",
    ignoreAttributes: true,
    ignoreNameSpace: true,
    allowBooleanAttributes: false,
    parseNodeValue: true,
    parseAttributeValue: false,
    trimValues: true,
    cdataTagName: "__cdata", //default is 'false'
    cdataPositionChar: "\\c",
    parseTrueNumberOnly: false,
    arrayMode: false,
    attrValueProcessor: (val, attrName) => he.decode(val, {isAttributeValue: true}),
    tagValueProcessor: (val, tagName) => he.decode(val),
    stopNodes: ["parse-me-as-string"]
};


let PI_ENDPOINT = "http://172.25.39.13:3003";
let OSD_ENDPOINT = "http://172.25.39.16:2222";

let HOST = process.env.PROD_HOST;
if (process.env.NODE_ENV === "development") {
    HOST = process.env.TEST_HOST;
    PI_ENDPOINT = "http://172.25.38.42:3003";
    OSD_ENDPOINT = "http://172.25.38.43:2222";
}


module.exports = {

    renderlogin: async (req, res) => {
        res.render("login", {error: req.flash("error")})

    },

    renderforgetPasswd: async (req, res) => {
        res.render("forget_passwd")

    },

    rendercreateuser: async (req, res) => {
        res.render("createuser")
    },

    renderdashboard: async (req, res) => {
        const status = {
            sub: "active",
            maccount: "",
            top: "",
            load: "",
            manage: "",
            overscratch: "",
            hist: "",
            act: "",
            tra: "",
        };
        const role = utils.getUserRole(req.user);
        let firstname = req.user.firstname;
        firstname = firstname.charAt(0).toUpperCase() + firstname.substring(1);
        res.render("dashboard", {status, ...role, firstname})

    },
    getbalances: async (req, res) => {
        let msisdn = req.query.msisdn;

        let processBalance = false;
        let processSubInfo = false;
        let processAcctTags = false;

        const url = PI_ENDPOINT;
        const sampleHeaders = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'urn:CCSCD1_QRY',
        };

        let getBalancexml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSCD1_QRY>
         <pi:username>admin</pi:username>
         <pi:password>admin</pi:password>
         <pi:MSISDN>${msisdn}</pi:MSISDN>
         <pi:LIST_TYPE>BALANCE</pi:LIST_TYPE>
         <pi:WALLET_TYPE>Primary</pi:WALLET_TYPE>
         <pi:BALANCE_TYPE>ALL</pi:BALANCE_TYPE>
      </pi:CCSCD1_QRY>
   </soapenv:Body>
</soapenv:Envelope>`;


        let getSubInfoxml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSCD1_QRY>
         <pi:username>admin</pi:username>
         <pi:password>admin</pi:password>
         <pi:MSISDN>${msisdn}</pi:MSISDN>
         <pi:WALLET_TYPE>Primary</pi:WALLET_TYPE>
      </pi:CCSCD1_QRY>
   </soapenv:Body>
</soapenv:Envelope>`;


        let getTagsInfo = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSCD9_QRY>
         <pi:AUTH/>
         <pi:username>admin</pi:username>
         <pi:password>admin</pi:password>
         <pi:MSISDN>${msisdn}</pi:MSISDN>
         <pi:TAG>IMSI|IMEI|DeviceType|AltSMSNotifNo|GiftTransferCount|TempTag|EmailID</pi:TAG>
      </pi:CCSCD9_QRY>
   </soapenv:Body>
</soapenv:Envelope>`;

        try {
            /*............Processing Sub Balance...........*/

            const {response} = await soapRequest({url: url, headers: sampleHeaders, xml: getBalancexml, timeout: 3000}); // Optional timeout parameter(milliseconds)

            const {headers, body, statusCode} = response;

            let balanceResult = [];
            let general_acct_info = [];
            let acct_tags = [];

            let finalResult = {};


            if (parser.validate(body) === true) { //optional (it'll return an object in case it's not valid)
                let jsonObj = parser.parse(body, options);


                const soapResponseBody = jsonObj.Envelope.Body
                if (soapResponseBody.Fault) {
                    return res.json({error: soapResponseBody.Fault.faultstring})

                } else {
                    let result = soapResponseBody['CCSCD1_QRYResponse']['BALANCES']['BALANCE_ITEM'];

                    if (result) {
                        processBalance = true;

                        result.forEach(function (item) {
                            if (item.BUCKETS) {
                                if (Array.isArray(item.BUCKETS.BUCKET_ITEM)) {
                                    let bucket_item = item.BUCKETS.BUCKET_ITEM;
                                    bucket_item.forEach(function (bucket) {
                                        let balance_data = {};
                                        balance_data.balance_type = utils.getBundleName(item.BALANCE_TYPE_NAME) ? utils.getBundleName(item.BALANCE_TYPE_NAME) : item.BALANCE_TYPE_NAME;
                                        balance_data.value = bucket.BUCKET_VALUE;
                                        balance_data.expiry_date = bucket.BUCKET_EXPIRY ? utils.formateDate(bucket.BUCKET_EXPIRY) : "";
                                        balanceResult.push(balance_data);

                                    })

                                } else {
                                    let balance_data = {};
                                    balance_data.balance_type = utils.getBundleName(item.BALANCE_TYPE_NAME) ? utils.getBundleName(item.BALANCE_TYPE_NAME) : item.BALANCE_TYPE_NAME;
                                    balance_data.value = item.BUCKETS.BUCKET_ITEM.BUCKET_VALUE;
                                    balance_data.expiry_date = item.BUCKETS.BUCKET_ITEM.BUCKET_EXPIRY ? utils.formateDate(item.BUCKETS.BUCKET_ITEM.BUCKET_EXPIRY) : "";
                                    balanceResult.push(balance_data);

                                }
                            }


                        });


                    }
                    //console.log(balanceResult)

                    /*............Processing SubInfo...........*/

                    if (processBalance) {
                        const {response} = await soapRequest({
                            url: url,
                            headers: sampleHeaders,
                            xml: getSubInfoxml,
                            timeout: 3000
                        });
                        const {headers, body, statusCode} = response;
                        let jsonObj = parser.parse(body, options);
                        let acct_infoResult = jsonObj.Envelope.Body.CCSCD1_QRYResponse;
                        if (acct_infoResult) {
                            processSubInfo = true;
                            general_acct_info.push({
                                parameterName: "Account Status",
                                parameterValue: utils.getAcctState(acct_infoResult['STATUS'])
                            });
                            general_acct_info.push({
                                parameterName: "Service Class",
                                parameterValue: acct_infoResult['PRODUCT']
                            });
                            general_acct_info.push({
                                parameterName: "Creation Date",
                                parameterValue: acct_infoResult['CREATION_DATE'] ? utils.formateDate(acct_infoResult['CREATION_DATE']) : "n/a"
                            });
                            general_acct_info.push({
                                parameterName: "Initial Activation Date",
                                parameterValue: acct_infoResult['CREATION_DATE'] ? utils.formateDate(acct_infoResult['FIRST_ACTIVATION_DATE']) : "n/a"
                            });
                        }

                        /*............Processing Subscriber Tag.......*/

                        if (processSubInfo) {
                            const {response} = await soapRequest({
                                url: url,
                                headers: sampleHeaders,
                                xml: getTagsInfo,
                                timeout: 3000
                            });
                            const {body} = response;
                            let jsonObj = parser.parse(body, options);
                            if (jsonObj.Envelope.Body.CCSCD9_QRYResponse && jsonObj.Envelope.Body.CCSCD9_QRYResponse.TAGS && jsonObj.Envelope.Body.CCSCD9_QRYResponse.TAGS.TAG) {
                                let acct_tags_jsonResult = jsonObj.Envelope.Body.CCSCD9_QRYResponse.TAGS.TAG;


                                let isImsi, isImei, isDeviceType, isEmailId, isPhoneContact, isGiftTransferCounter,
                                    isTemTag = false;

                                if (Array.isArray(acct_tags_jsonResult)) {
                                    acct_tags_jsonResult.forEach(function (tag) {
                                        if (tag.NAME === 'AltSMSNotifNo') {
                                            general_acct_info.push({
                                                parameterName: "Phone Contact",
                                                parameterValue: tag.VALUE ? tag.VALUE : "n/a"
                                            });
                                            isPhoneContact = true;
                                        }
                                        if (tag.NAME === 'IMSI') {
                                            general_acct_info.push({
                                                parameterName: "IMSI",
                                                parameterValue: tag.VALUE ? tag.VALUE : "n/a"
                                            });
                                            isImsi = true;
                                        }
                                        if (tag.NAME === 'IMEI') {
                                            general_acct_info.push({
                                                parameterName: "IMEI",
                                                parameterValue: tag.VALUE ? tag.VALUE : "n/a"
                                            });
                                            isImei = true;
                                        }
                                        if (tag.NAME === 'DeviceType') {
                                            general_acct_info.push({
                                                parameterName: "Device Type",
                                                parameterValue: tag.VALUE ? tag.VALUE : "n/a"
                                            });
                                            isDeviceType = true;
                                        }
                                        if (tag.NAME === 'EmailID') {
                                            general_acct_info.push({
                                                parameterName: "Email Address",
                                                parameterValue: tag.VALUE ? tag.VALUE : "n/a"
                                            });
                                            isEmailId = true;
                                        }

                                        if (tag.NAME === 'GiftTransferCount') {
                                            acct_tags.push({
                                                parameterName: "Gift Transfer Counter",
                                                parameterValue: tag.VALUE ? tag.VALUE : "n/a"
                                            });
                                            isGiftTransferCounter = true;
                                        }
                                        if (tag.NAME === 'TempTag' && /winback/i.test(tag.VALUE.toString())) {
                                            acct_tags.push({
                                                parameterName: "Winback Status",
                                                parameterValue: tag.VALUE ? tag.VALUE : "n/a"
                                            });
                                            isTemTag = true;
                                        }

                                    })

                                } else {
                                    let tag = acct_tags_jsonResult;

                                    if (tag.NAME === 'AltSMSNotifNo') {
                                        general_acct_info.push({
                                            parameterName: "Phone Contact",
                                            parameterValue: tag.VALUE ? tag.VALUE : "n/a"
                                        });
                                        isPhoneContact = true;
                                    }
                                    if (tag.NAME === 'IMSI') {
                                        general_acct_info.push({
                                            parameterName: "IMSI",
                                            parameterValue: tag.VALUE ? tag.VALUE : "n/a"
                                        });
                                        isImsi = true;
                                    }
                                    if (tag.NAME === 'IMEI') {
                                        general_acct_info.push({
                                            parameterName: "IMEI",
                                            parameterValue: tag.VALUE ? tag.VALUE : "n/a"
                                        });
                                        isImei = true;
                                    }
                                    if (tag.NAME === 'DeviceType') {
                                        general_acct_info.push({
                                            parameterName: "Device Type",
                                            parameterValue: tag.VALUE ? tag.VALUE : "n/a"
                                        });
                                        isDeviceType = true;
                                    }
                                    if (tag.NAME === 'EmailID') {
                                        general_acct_info.push({
                                            parameterName: "Email Address",
                                            parameterValue: tag.VALUE ? tag.VALUE : "n/a"
                                        });
                                        isEmailId = true;
                                    }

                                    if (tag.NAME === 'GiftTransferCount') {
                                        acct_tags.push({
                                            parameterName: "Gift Transfer Counter",
                                            parameterValue: tag.VALUE ? tag.VALUE : "n/a"
                                        });
                                        isGiftTransferCounter = true;
                                    }
                                    if (tag.NAME === 'TempTag' && /winback/i.test(tag.VALUE.toString())) {
                                        acct_tags.push({
                                            parameterName: "Winback Status",
                                            parameterValue: tag.VALUE ? tag.VALUE : "n/a"
                                        });
                                        isTemTag = true;
                                    }

                                }


                                processAcctTags = true;
                                if (!isDeviceType) general_acct_info.push({
                                    parameterName: "Device Type",
                                    parameterValue: ""
                                });
                                if (!isPhoneContact) general_acct_info.push({
                                    parameterName: "Phone Contact",
                                    parameterValue: ""
                                });
                                if (!isEmailId) general_acct_info.push({
                                    parameterName: "Email Address",
                                    parameterValue: ""
                                });
                                if (!isImsi) general_acct_info.push({parameterName: "IMSI", parameterValue: ""});
                                if (!isImei) general_acct_info.push({parameterName: "IMEI", parameterValue: ""});
                                if (!isGiftTransferCounter) acct_tags.push({
                                    parameterName: "Gift Transfer Counter",
                                    parameterValue: ""
                                });
                                if (!isTemTag) acct_tags.push({parameterName: "Winback Status", parameterValue: ""});

                            }


                        }


                    }
                    finalResult.balances = balanceResult;
                    finalResult.general_acct = general_acct_info;
                    finalResult.acct_tags = acct_tags;
                    res.json(finalResult);

                    // if (processBalance && processSubInfo && processAcctTags) {
                    //     finalResult.balances = balanceResult;
                    //     finalResult.general_acct = general_acct_info;
                    //     finalResult.acct_tags = acct_tags;
                    //     res.json(finalResult);
                    //
                    // }

                }


            }


        } catch (e) {
            res.json({error: "Network Error, IN not reachable"});
            console.log(e)


        }


    },

    rendertopup: async (req, res) => {
        const status = {
            sub: "",
            maccount: "",
            top: "active",
            load: "",
            manage: "",
            overscratch: "",
            hist: "",
            act: "",
            tra: "",
        }
        const role = utils.getUserRole(req.user)
        res.render("topUp", {status, ...role})

    },

    getbundles: async (req, res) => {
        const msisdn = req.query.msisdn

        const url = OSD_ENDPOINT;
        const sampleHeaders = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'http://SCLINSMSVM01P/wsdls/Surfline/VoucherRecharge_USSD/VoucherRecharge_USSD',
            'Authorization': 'Basic YWlhb3NkMDE6YWlhb3NkMDE='
        };

        let xmlRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pac="http://SCLINSMSVM01P/wsdls/Surfline/Package_Query_USSD.wsdl">
   <soapenv:Header/>
   <soapenv:Body>
      <pac:PackageQueryUSSDRequest>
         <CC_Calling_Party_Id>${msisdn}</CC_Calling_Party_Id>
      </pac:PackageQueryUSSDRequest>
   </soapenv:Body>
</soapenv:Envelope>`;
        try {
            const {response} = await soapRequest({url: url, headers: sampleHeaders, xml: xmlRequest, timeout: 3000}); // Optional timeout parameter(milliseconds)

            const {body} = response;

            if (body.includes("faultcode")) {
                const errorInfo = {};
                let regex = /errorCode>(.+)<\//
                let match = regex.exec(body);


            } else if (parser.validate(body) === true) {
                let jsonObj = parser.parse(body, options);
                let result = jsonObj.Envelope.Body;
                let packages = result.PackageQueryUSSDResult;


                const categoriesSet = new Set();
                const bundleEl_Value_Array = [];

                let resultEl_value;

                for (const [k, v] of Object.entries(packages)) {

                    if (k.startsWith("bundle")) {
                        let regex = /(.+?)\|/
                        let match = regex.exec(v.toString());
                        categoriesSet.add(match[1]);
                        bundleEl_Value_Array.push(v.toString())

                    } else if (k.startsWith("Result")) {
                        resultEl_value = v.toString();

                    }


                }

                if (categoriesSet.size > 0 && bundleEl_Value_Array.length > 0) {
                    const final_bundles = [];
                    let catArray = [...categoriesSet];
                    for (let i = 0; i < catArray.length; i++) {
                        let catValue = catArray[i];
                        let catObject = {};
                        catObject.name = catValue;
                        catObject.active = i === 0 ? "active" : "";
                        catObject.id = "cat-" + i;
                        catObject.bundles = [];
                        for (let j = 0; j < bundleEl_Value_Array.length; j++) {
                            if (bundleEl_Value_Array[j].startsWith(catValue)) {
                                let tempStringArray = bundleEl_Value_Array[j].split("|");
                                let bundleDetails = tempStringArray[1];
                                let bundleId = tempStringArray[2];
                                let periodicity = tempStringArray[3];
                                let bundleDetailtemp = bundleDetails.split(/\s@|\s\//g);
                                let dataValue = bundleDetailtemp[0];
                                let price = bundleDetailtemp[1];
                                price = price.substring(3)
                                let period = bundleDetailtemp[2];
                                let validity = parseInt(bundleDetailtemp[2]);
                                let validity_period;
                                if (/hrs/ig.test(period.toString())) {
                                    validity_period = "hrs";
                                } else {
                                    validity_period = "days";
                                }
                                validity = `${validity} ${validity_period}`;

                                catObject.bundles.push(
                                    {
                                        bundle_name: dataValue,
                                        price: price,
                                        validity: validity,
                                        bundleId: bundleId,
                                        one_off: "One-Off",
                                        recurrent: periodicity > 1 ? "Recurrent" : ""
                                    });
                            }

                        }
                        final_bundles.push({
                            category: catObject
                        })

                    }

                    res.json({dataSet: final_bundles})


                } else {
                    res.json({error: resultEl_value})
                }

            } else {
                res.json({error: "System Error"})
            }

        } catch (e) {
            console.log(e);
            res.json({error: "System Error"})

        }


    },

    postbundle: async (req, res) => {
        console.log(req.body)
        const {msisdn, bdlid, subtype, reason} = req.body;
        const txn_id = uuid.v4();
        const user = req.user.username;
        const url = OSD_ENDPOINT;

        const sampleHeaders = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'http://SCLINSMSVM01P/wsdls/Surfline/DATA_Recharges/DATA_Recharges',
            'Authorization': 'Basic YWlhb3NkMDE6YWlhb3NkMDE='
        };


        let xmlRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:data="http://SCLINSMSVM01P/wsdls/Surfline/DATA_Recharges.wsdl">
   <soapenv:Header/>
   <soapenv:Body>
      <data:DATA_RechargesRequest>
         <CC_Calling_Party_Id>${msisdn}</CC_Calling_Party_Id>
         <CHANNEL>TEST</CHANNEL>
         <TRANSACTION_ID>${txn_id}</TRANSACTION_ID>
         <BundleName>${bdlid}</BundleName>
         <SubscriptionType>${subtype}</SubscriptionType>
         <REASON>${reason}</REASON>
         <POS_USER>${user}</POS_USER>
      </data:DATA_RechargesRequest>
   </soapenv:Body>
</soapenv:Envelope>`;

        try {
            const {response} = await soapRequest({url: url, headers: sampleHeaders, xml: xmlRequest, timeout: 3000}); // Optional timeout parameter(milliseconds)

            const {body} = response;
            let jsonObj = parser.parse(body, options);
            if (!jsonObj.Envelope.Body.DATA_RechargesResult) {
                res.json({success: "success"});
                let transaction_details = `msisdn=${msisdn}|bundleid=${bdlid}|subType=${subtype}|reason=${reason}`;
                let username = user;
                let transaction_id = txn_id;
                let status = "completed";
                let transaction_type = "bundle purchase";
                let userlog = new UserLog({username, transaction_id, transaction_type, transaction_details, status});
                userlog = await userlog.save();
                if (userlog) {
                } else {
                    console.log("Transaction logging failed")

                }

            }


        } catch (error) {
            let jsonObj = parser.parse(error.toString(), options);
            const soapResponseBody = jsonObj.Envelope.Body;
            const errorCode = soapResponseBody.Fault.detail.DATA_RechargesFault.errorCode;
            let faultMessage = "Network Failure, IN not reachable";
            switch (errorCode) {
                case 50:
                    faultMessage = "Account is not active";
                    break;
                case 51:
                    faultMessage = "Invalid Bundle";
                    break;
                case 53:
                    faultMessage = "Transient Error";
                    break;
                case 55:
                    faultMessage = "Account has insufficient credit/General Failure";
                    break;

                case 102:
                    faultMessage = "Purchase not allowed.Account has active unlimited bundle";
                    break;
                case 105:
                    faultMessage = "Purchase of this bundle  is not allowed at this time";
                    break;
            }

            res.json({error: faultMessage});


        }


    },
    renderloadcard: async (req, res) => {

        const status = {
            sub: "",
            maccount: "",
            top: "",
            load: "active",
            manage: "",
            overscratch: "",
            hist: "",
            act: "",
            tra: "",
        }
        const role = utils.getUserRole(req.user);
        res.render("load_card", {status, ...role})

    },
    postloadcard: async (req, res) => {
        let msisdn = req.body.msisdn;
        let voucher_pin = req.body.pin;
        let txn_id = uuid.v4();
        let user = req.user.username;


        const url = OSD_ENDPOINT;
        const sampleHeaders = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'http://SCLINSMSVM01P/wsdls/Surfline/VoucherRecharge_USSD/VoucherRecharge_USSD',
            'Authorization': 'Basic YWlhb3NkMDE6YWlhb3NkMDE='
        };

        let xmlvoucher = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:vouc="http://SCLINSMSVM01P/wsdls/Surfline/VoucherRecharge.wsdl">
   <soapenv:Header/>
   <soapenv:Body>
      <vouc:VoucherRechargeRequest>
         <CC_Calling_Party_Id>${msisdn}</CC_Calling_Party_Id>
         <CHANNEL>IN_Web_Portal</CHANNEL>
         <TRANSACTION_ID>${txn_id}</TRANSACTION_ID>
         <WALLET_TYPE>Primary</WALLET_TYPE>
         <POS_USER>${user}</POS_USER>
         <VoucherNumber>${voucher_pin}</VoucherNumber>
         <ScenarioID>1</ScenarioID>
      </vouc:VoucherRechargeRequest>
   </soapenv:Body>
</soapenv:Envelope>
`;
        try {
            const {response} = await soapRequest({url: url, headers: sampleHeaders, xml: xmlvoucher, timeout: 3000}); // Optional timeout parameter(milliseconds)

            const {body} = response;

            let jsonObj = parser.parse(body, options);
            if (!jsonObj.Envelope.Body.VoucherRechargeResult) {
                res.json({success: "success"});
                let transaction_details = `msisdn=${msisdn}|voucher_pin=${voucher_pin}`;
                let username = user;
                let transaction_id = txn_id;
                let status = "completed";
                let transaction_type = "voucher top-up";
                let userlog = new UserLog({username, transaction_id, transaction_type, transaction_details, status});
                userlog = await userlog.save();
                if (userlog) {
                } else {
                    console.log("Transaction logging failed")

                }

            }


        } catch (error) {
            console.log(error.toString())
            let jsonObj = parser.parse(error.toString(), options);
            const soapResponseBody = jsonObj.Envelope.Body;
            console.log(soapResponseBody)
            const errorCode = soapResponseBody.Fault.detail.VoucherRechargeFault.errorCode;
            let faultMessage = "Network Failure, IN not reachable";
            switch (errorCode) {
                case 60:
                    faultMessage = "Account is not ACTIVE";
                    break;
                case 63:
                    faultMessage = "Missing input parameters";
                    break;
                case 67:
                    faultMessage = "Voucher already USED";
                    break;
                case 68:
                    faultMessage = "Voucher is INVALID";
                    break;
            }
            console.log(faultMessage)

            res.json({error: faultMessage});

        }

    },
    rendercheckVoucher: async (req, res) => {
        const status = {
            sub: "",
            maccount: "",
            top: "",
            load: "",
            manage: "active",
            overscratch: "",
            hist: "",
            act: "",
            tra: "",
        }
        const role = utils.getUserRole(req.user)
        res.render("checkvoucher", {status, ...role})

    },
    rendermanageAccount: async (req, res) => {
        const status = {
            sub: "",
            maccount: "active",
            top: "",
            load: "",
            manage: "",
            overscratch: "",
            hist: "",
            act: "",
            tra: "",
        };
        const topNav = {
            expiredata: "",
            changeacctstate: "",
            changephonecontact: "",
            managerecurrent: "",
            changeproduct: "",
            adjustexpiry: ""
        };
        const role = utils.getUserRole(req.user);
        res.render("manageaccount", {status, topNav, ...role})


    },
    postmanagevoucher: async (req, res) => {

        const errorInfo = {};

        try {

            const url = PI_ENDPOINT;
            const sampleHeaders = {
                'User-Agent': 'NodeApp',
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': 'urn:CCSVR1_QRY',
            };
            let serial = req.body.serial.trim();

            let xmlvoucher = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSVR1_QRY>
         <pi:username>admin</pi:username>
         <pi:password>admin</pi:password>
         <pi:PROVIDER>Surfline</pi:PROVIDER>
         <pi:SERIAL>${serial}</pi:SERIAL>
      </pi:CCSVR1_QRY>
   </soapenv:Body>
</soapenv:Envelope>`;
            const {response} = await soapRequest({url: url, headers: sampleHeaders, xml: xmlvoucher, timeout: 4000}); // Optional timeout parameter(milliseconds)


            const {body} = response;

            if (body.includes("faultcode")) {

                let regex = /<faultstring>(.+)<\/faultstring>/g;
                let match = regex.exec(body);
                errorInfo.message = match[1];

                regex = /<pi:CODE>(.+)<\/pi:CODE>/g;
                match = regex.exec(body);
                errorInfo.code = match[1];

                res.json({error: errorInfo})


            } else {

                const parser = new xml2js.Parser();
                const result = await parser.parseStringPromise(body);

                let v_pin = result['env:Envelope']['env:Body'][0]['pi:CCSVR1_QRYResponse'][0]['pi:VOUCHER'][0],
                    v_activation_date = result['env:Envelope']['env:Body'][0]['pi:CCSVR1_QRYResponse'][0]['pi:ACTIVATION_DATE'][0],
                    v_expiration_date = result['env:Envelope']['env:Body'][0]['pi:CCSVR1_QRYResponse'][0]['pi:EXPIRY_DATE'][0],
                    v_status = result['env:Envelope']['env:Body'][0]['pi:CCSVR1_QRYResponse'][0]['pi:STATUS'][0],
                    v_type = result['env:Envelope']['env:Body'][0]['pi:CCSVR1_QRYResponse'][0]['pi:TYPE'][0],
                    v_msisdn = result['env:Envelope']['env:Body'][0]['pi:CCSVR1_QRYResponse'][0]['pi:MSISDN'][0],
                    v_redeemed_date = result['env:Envelope']['env:Body'][0]['pi:CCSVR1_QRYResponse'][0]['pi:REDEEMED_DATE'][0],
                    v_description = result['env:Envelope']['env:Body'][0]['pi:CCSVR1_QRYResponse'][0]['pi:DESCRIPTION'][0],
                    v_serial = result['env:Envelope']['env:Body'][0]['pi:CCSVR1_QRYResponse'][0]['pi:SERIAL'][0];


                const voucher_info = {
                    v_status: v_status ? utils.formatVoucherStatus(v_status, v_redeemed_date) : "n/a",
                    v_serial: v_serial ? v_serial : "n/a",
                    v_pin: v_pin ? v_pin : "n/a",
                    v_activation_date: v_activation_date ? utils.formateDate(v_activation_date) : "n/a",
                    v_expiration_date: v_expiration_date ? utils.formateDate(v_expiration_date) : "n/a",
                    v_type: v_type ? v_type : "n/a",
                    v_msisdn: v_msisdn ? v_msisdn : "n/a",
                    v_redeemed_date: v_redeemed_date ? utils.formateDate(v_redeemed_date) : "n/a",
                    v_description: v_description ? v_description : "n/a",
                };

                res.json({success: voucher_info});

            }


        } catch (error) {
            console.log(error);
            errorInfo.message = "IN not reachable";
            errorInfo.code = "1";
            res.json({error: errorInfo})

        }

    },

    renderviewhistory: (req, res) => {
        const status = {
            sub: "",
            maccount: "",
            top: "",
            load: "",
            manage: "",
            overscratch: "",
            hist: "active",
            act: "",
            tra: "",
        }
        const role = utils.getUserRole(req.user);
        res.render("viewHist", {status, ...role});

    },

    renderactivate: (req, res) => {

        const status = {
            sub: "",
            maccount: "",
            top: "",
            load: "",
            manage: "",
            overscratch: "",
            hist: "",
            act: "active",
            tra: "",
        }
        const role = utils.getUserRole(req.user);
        res.render("activateAccount", {status, ...role});

    },

    rendertransfer: (req, res) => {

        const status = {
            sub: "",
            maccount: "",
            top: "",
            load: "",
            manage: "",
            overscratch: "",
            hist: "",
            act: "",
            tra: "active",
        };

        const balanceTypes = [
            "1.5GBSurfplus Data",
            "3GBSurfplus Data",
            "4.5GBSurfplus Data",
            "6GBSurfplus Data",
            "8GBSurfplus Data",
            "15GBSurfplus Data",
            "30GBSurfplus Data",
            "45GBSurfplus Data",
            "75GBSurfplus Data",
            "100GBSurfplus Data",
            "Promotional Data",
            "Data",
            "Bonus Data",
            "Gift Data",
            "Ten4Ten Data"
        ]
        const role = utils.getUserRole(req.user)
        res.render("transfer", {status, balanceTypes: balanceTypes, ...role})

    },

    renderoverscratch: (req, res) => {
        const status = {
            sub: "",
            maccount: "",
            top: "",
            load: "",
            manage: "",
            overscratch: "active",
            hist: "",
            act: "",
            tra: "",
        }
        const role = utils.getUserRole(req.user)
        res.render("overscratchtopup", {status, ...role})


    },
    postoverscratchtop: async (req, res) => {
        let {msisdn, serial} = req.body;

        serial = parseInt(serial).toString();
        let txn_id = uuid.v4();
        let user = req.user.username


        try {

            const url_vQuery = PI_ENDPOINT;
            const v_QueryHeaders = {
                'User-Agent': 'NodeApp',
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': 'urn:CCSVR1_QRY',
            };


            let AMOUNT;
            let isCashTopUpSuccess = false;

            let xmlvoucher = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSVR1_QRY>
         <pi:username>admin</pi:username>
         <pi:password>admin</pi:password>
         <pi:PROVIDER>Surfline</pi:PROVIDER>
         <pi:SERIAL>${serial}</pi:SERIAL>
      </pi:CCSVR1_QRY>
   </soapenv:Body>
</soapenv:Envelope>`;


            const url_cashTop = OSD_ENDPOINT;
            const cashTopupHeaders = {

                'User-Agent': 'NodeApp',
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': 'http://172.25.39.13/wsdls/Surfline/CustomRecharge/CustomRecharge',
                'Authorization': 'Basic YWlhb3NkMDE6YWlhb3NkMDE=',

            };


            const {response} = await soapRequest({
                url: url_vQuery,
                headers: v_QueryHeaders,
                xml: xmlvoucher,
                timeout: 4000
            });
            const {body} = response;

            let jsonObj = parser.parse(body, options);
            if (jsonObj.Envelope.Body.CCSVR1_QRYResponse) {
                const soapResponseBody = jsonObj.Envelope.Body.CCSVR1_QRYResponse;

                const v_status = soapResponseBody.STATUS;
                const v_redeemed_date = soapResponseBody.REDEEMED_DATE;
                const balances = soapResponseBody.BALANCES.BALANCE_ITEM;


                if (v_status === 'A' && !v_redeemed_date) {
                    if (Array.isArray(balances)) {
                        balances.forEach(function (balance) {

                            if (balance.BALANCE_TYPE === "General Cash") {
                                AMOUNT = balance.AMOUNT;
                            }

                        });

                    } else {

                        if (balances.BALANCE_TYPE === "General Cash") {
                            AMOUNT = balances.AMOUNT;
                        }
                    }


                } else {
                    return res.json({error: "Voucher already USED"});
                }

            } else {
                let soapFault = jsonObj.Envelope.Body.Fault;
                let faultString = soapFault.faultstring;
                return res.json({error: faultString});
            }


            if (AMOUNT) {
                const cashTopXML = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cas="http://SCLINSMSVM01T/wsdls/Surfline/CashTopUpOverscratch.wsdl">
   <soapenv:Header/>
   <soapenv:Body>
      <cas:CashTopUpOverscratchRequest>
         <CC_Calling_Party_Id>${msisdn}</CC_Calling_Party_Id>
         <Recharge_List_List>
            <Recharge_List>
               <Balance_Type_Name>General Cash</Balance_Type_Name>
               <Recharge_Amount>${AMOUNT}</Recharge_Amount>
               <Balance_Expiry_Extension_Period/>
               <Balance_Expiry_Extension_Policy/>
               <Bucket_Creation_Policy/>
               <Balance_Expiry_Extension_Type/>
            </Recharge_List>
         </Recharge_List_List>
         <CHANNEL>IN_Web</CHANNEL>
         <VOUCHER_SERIAL>${serial}</VOUCHER_SERIAL>
         <TRANSACTION_ID>${txn_id}</TRANSACTION_ID>
         <POS_USER>${user}</POS_USER>
      </cas:CashTopUpOverscratchRequest>
   </soapenv:Body>
</soapenv:Envelope>`;


                const {response} = await soapRequest({
                    url: url_cashTop,
                    headers: cashTopupHeaders,
                    xml: cashTopXML,
                    timeout: 4000
                });
                const {body} = response;
                let jsonObj = parser.parse(body, options);
                const soapResponseBody = jsonObj.Envelope.Body;

                if (!soapResponseBody.CashTopUpOverscratchRequest) {
                    isCashTopUpSuccess = true;
                } else {
                    let soapFault = jsonObj.Envelope.Body.Fault;
                    let faultString = soapFault.faultstring;
                    return res.json({error: faultString});
                }


            }


            if (isCashTopUpSuccess) {

                let timestamp = moment().format("YYYY-MM-DD HH:mm:ss");

                const vFreezeXML = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSVR1_FRZ>
         <pi:username>admin</pi:username> 
         <pi:password>admin</pi:password>
         <pi:SERIAL>${serial}</pi:SERIAL>
         <pi:DESCRIPTION>${msisdn}|${timestamp}|${user}</pi:DESCRIPTION>
      </pi:CCSVR1_FRZ>
   </soapenv:Body>
</soapenv:Envelope>`;


                const {response} = await soapRequest({
                    url: url_vQuery,
                    headers: v_QueryHeaders,
                    xml: vFreezeXML,
                    timeout: 4000
                });
                const {body} = response;
                let jsonObj = parser.parse(body, options);
                const soapResponseBody = jsonObj.Envelope.Body.CCSVR1_FRZResponse.AUTH;
                if (soapResponseBody && soapResponseBody.length > 0) {
                    res.json({success: "success"})

                    let transaction_details = `msisdn=${msisdn}|voucher_serial=${serial}|amount=${AMOUNT}`;
                    let username = user;
                    let transaction_id = txn_id;
                    let status = "completed";
                    let transaction_type = "over-scratch top-up";
                    let userlog = new UserLog({
                        username,
                        transaction_id,
                        transaction_type,
                        transaction_details,
                        status
                    });
                    userlog = await userlog.save();
                    if (userlog) {
                    } else {
                        console.log("Transaction logging failed")

                    }


                } else {

                    let soapFault = jsonObj.Envelope.Body.Fault;
                    let faultString = soapFault.faultstring;
                    res.json({error: faultString});

                }

            }

        } catch (error) {
            let errorBody = error.toString();
            console.log(errorBody);
            if (parser.validate(errorBody) === true) {
                let jsonObj = parser.parse(errorBody, options);
                let soapFault = jsonObj.Envelope.Body.Fault;
                let faultString = soapFault.faultstring;
                let errorCode = soapFault.detail.CashTopUpOverscratchFault.errorCode
                let errorMessage = faultString;
                switch (errorCode) {
                    case 60:
                        errorMessage = "Subscriber number is INVALID";
                        break;
                    case 61:
                        errorMessage = "Cash crediting Failure";
                        break;
                }


                return res.json({error: errorMessage});

            } else {
                return res.json({error: "System Failure"});

            }


        }


    },

    posttransfer: async (req, res) => {


        try {

            let period = 0;
            let validity_default = "";

            let {from_msisdn, to_msisdn, amount, to_bundle, from_bundle, validity, validity_type} = req.body;

            const {error} = validator.validateDataTransfer({from_msisdn, to_msisdn, amount, to_bundle, from_bundle});
            if (error) {
                res.json({error: error.message})

            } else {

                amount = Math.round(amount * 1048576);

                if (validity && parseInt(validity)) {
                    validity_default = validity;
                    switch (validity_type) {
                        case "days":
                            period = 0;
                            break;
                        case "months":
                            period = 1;
                            break
                    }
                }


                let isDebitSuccess = false;


                let txn_id = uuid.v4();
                let user = req.user.username;

                const debiturl = PI_ENDPOINT;

                const debitheaders = {
                    'User-Agent': 'NodeApp',
                    'Content-Type': 'text/xml;charset=UTF-8',
                    'SOAPAction': 'urn:CCSCD1_CHG',
                };


                const debitXML = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSCD1_CHG>
         <pi:username>admin</pi:username>
         <pi:password>admin</pi:password>
         <pi:MSISDN>${from_msisdn}</pi:MSISDN>
         <pi:BALANCE_TYPE>${from_bundle}</pi:BALANCE_TYPE>
         <pi:BALANCE>${amount}</pi:BALANCE>
         <pi:EXTRA_EDR>TRANSACTION_ID=${txn_id}|CHANNEL=IN_Web|POS_USER=${user}</pi:EXTRA_EDR>
      </pi:CCSCD1_CHG>
   </soapenv:Body>
</soapenv:Envelope>`;

                const {response} = await soapRequest({
                    url: debiturl,
                    headers: debitheaders,
                    xml: debitXML,
                    timeout: 4000
                });
                const {body} = response;
                let jsonObj = parser.parse(body, options);

                const soapResponseBody = jsonObj.Envelope.Body;

                if (soapResponseBody.CCSCD1_CHGResponse && soapResponseBody.CCSCD1_CHGResponse.AUTH) {
                    isDebitSuccess = true;
                } else {
                    let soapFault = jsonObj.Envelope.Body.Fault;
                    let faultString = soapFault.faultstring;
                    return res.json({error: faultString.toString()})
                }

                if (isDebitSuccess) {

                    const url = OSD_ENDPOINT;

                    const headers = {
                        'User-Agent': 'NodeApp',
                        'Content-Type': 'text/xml;charset=UTF-8',
                        'SOAPAction': 'http://172.25.39.13/wsdls/Surfline/CustomRecharge/CustomRecharge',
                        'Authorization': 'Basic YWlhb3NkMDE6YWlhb3NkMDE='
                    };


                    const creditXML = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:dat="http://SCLINSMSVM01T/wsdls/Surfline/DataTransferManual.wsdl">
   <soapenv:Header/>
   <soapenv:Body>
      <dat:DataTransferManualRequest>
         <CC_Calling_Party_Id>${to_msisdn}</CC_Calling_Party_Id>
         <Recharge_List_List>
            <Recharge_List>
               <Balance_Type_Name>${to_bundle}</Balance_Type_Name>
               <Recharge_Amount>${amount}</Recharge_Amount>
               <Balance_Expiry_Extension_Period>${validity_default}</Balance_Expiry_Extension_Period>
               <Balance_Expiry_Extension_Policy></Balance_Expiry_Extension_Policy>
               <Bucket_Creation_Policy></Bucket_Creation_Policy>
               <Balance_Expiry_Extension_Type>${period}</Balance_Expiry_Extension_Type>
            </Recharge_List>
         </Recharge_List_List>
         <CHANNEL>IN_Web</CHANNEL>
         <TRANSACTION_ID>${txn_id}</TRANSACTION_ID>
         <POS_USER>${user}</POS_USER>
      </dat:DataTransferManualRequest>
   </soapenv:Body>
</soapenv:Envelope>`;
                    const {response} = await soapRequest({
                        url: url,
                        headers: headers,
                        xml: creditXML,
                        timeout: 4000
                    });
                    const {body} = response;
                    let jsonObj = parser.parse(body, options);
                    const soapResponseBody = jsonObj.Envelope.Body;
                    if (!soapResponseBody.DataTransferManualResult) {
                        res.json({success: "success"})
                        let transaction_details = `to_msisdn=${to_msisdn}|from_msisdn=${from_msisdn}|amount=${amount}|from_bundle=${from_bundle}|to_bundle=${to_bundle}|to_validity=${validity}|to_validity_type=${validity_type}`;
                        let username = user;
                        let transaction_id = txn_id;
                        let status = "completed";
                        let transaction_type = "data transfer";
                        let userlog = new UserLog({
                            username,
                            transaction_id,
                            transaction_type,
                            transaction_details,
                            status
                        });
                        userlog = await userlog.save();
                        if (userlog) {
                        } else {
                            console.log("Transaction logging failed")

                        }
                    } else {
                        let soapFault = jsonObj.Envelope.Body.Fault;
                        let faultString = soapFault.faultstring;
                        res.json({error: faultString.toString()})
                    }
                } else {
                    res.json({error: "Error occurred during debit"})
                }

            }


        } catch (error) {
            let errorBody = error.toString();
            let jsonObj = parser.parse(errorBody, options);
            let soapFault = jsonObj.Envelope.Body.Fault;
            let faultString = soapFault.faultstring;
            res.json({error: faultString.toString()})


        }


    },

    postActivate: async (req, res) => {

        const url = OSD_ENDPOINT;

        const headers = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'http://172.25.39.13/wsdls/Surfline/CustomRecharge/CustomRecharge',
            'Authorization': 'Basic YWlhb3NkMDE6YWlhb3NkMDE='
        };


        try {

            const {msisdn, firstname, lastname, idtype, id, phonecontact} = req.body;
            let user = req.user.username;
            let txn_id = uuid.v4();

            const XML = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:acc="http://SCLINSMSVM01T/wsdls/Surfline/AcctActivation.wsdl">
   <soapenv:Header/>
   <soapenv:Body>
      <acc:AcctActivationRequest>
         <CC_Calling_Party_Id>${msisdn}</CC_Calling_Party_Id>
         <firstName>${firstname}</firstName>
         <lastName>${lastname}</lastName>
         <IdType>${idtype}</IdType>
         <Id>${id}</Id>
         <phoneContact>${phonecontact}</phoneContact>
      </acc:AcctActivationRequest>
   </soapenv:Body>
</soapenv:Envelope>`;
            const {response} = await soapRequest({
                url: url,
                headers: headers,
                xml: XML,
                timeout: 4000
            });
            const {body} = response;
            let jsonObj = parser.parse(body, options);
            const soapResponseBody = jsonObj.Envelope.Body;
            if (!soapResponseBody.AcctActivationResult) {

                try {
                    const pool = mysql.createPool({
                        host: '172.25.33.141',
                        user: 'mme',
                        password: 'mme',
                        database: 'in_web'
                    });
                    const promisePool = pool.promise();
                    let sql = "insert into inActivatedSubs(firstname, lastname, msisdn, phonecontact,idtype, id) values(?,?,?,?,?,?)";
                    const row = await promisePool.execute(sql, [firstname, lastname, msisdn, phonecontact, idtype, id]);
                    console.log(row);
                } catch (e) {
                    console.log(e);

                }

                res.json({success: "success"});
                let transaction_details = `msisdn=${msisdn}|phonecontact=${phonecontact}|firstname=${firstname}|lastname=${lastname}|id=${id}|id_type=${idtype}`;
                let username = user;
                let transaction_id = txn_id;
                let status = "completed";
                let transaction_type = "new activation";
                let userlog = new UserLog({username, transaction_id, transaction_type, transaction_details, status});
                userlog = await userlog.save();
                if (userlog) {
                } else {
                    console.log("Transaction logging failed")

                }

            } else {
                let soapFault = jsonObj.Envelope.Body.Fault;
                let faultString = soapFault.faultstring;
                console.log(soapFault)
                res.json({error: faultString})
            }


        } catch (error) {
            let errorBody = error.toString();

            if (parser.validate(errorBody) === true) {
                let jsonObj = parser.parse(errorBody, options);
                if (jsonObj.Envelope.Body.Fault) {
                    let soapFault = jsonObj.Envelope.Body.Fault;
                    let faultString = soapFault.faultstring;
                    let errorcode = soapFault.detail.AcctActivationFault.errorCode.toString();
                    switch (errorcode) {
                        case "31":
                            faultString = "Invalid Subscriber provided";
                            break;

                        case "32":
                            faultString = "IN System Failure";
                            break;
                    }
                    res.json({error: faultString})

                } else {
                    console.log(jsonObj)
                    return res.json({error: jsonObj})
                }


            }

            console.log(errorBody)

            res.json({error: "IN not reachable, Please contact IN SysAdmin"})


        }


    },

    postViewHistory: async (req, res) => {


        let {msisdn, begin_date, end_date} = req.body;
        begin_date = moment(begin_date, 'DD-MM-YYYY HH:mm:ss').format("YYYYMMDDHHmmss");
        end_date = moment(end_date, 'DD-MM-YYYY HH:mm:ss').format("YYYYMMDDHHmmss");


        const url = PI_ENDPOINT;
        const sampleHeaders = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'urn:CCSCD7_QRY',
        };

        let xmlRequest = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSCD7_QRY>
         <pi:AUTH/>
         <pi:username>admin</pi:username>
         <pi:password>admin</pi:password>
         <pi:MSISDN>${msisdn}</pi:MSISDN>
         <pi:WALLET_TYPE>Primary</pi:WALLET_TYPE>
         <pi:EDR_TYPE>1</pi:EDR_TYPE>
         <pi:MAX_RECORDS>1000</pi:MAX_RECORDS>
         <pi:DAYS/>
         <pi:START_DATE>${begin_date}</pi:START_DATE>
         <pi:END_DATE>${end_date}</pi:END_DATE>
      </pi:CCSCD7_QRY>
   </soapenv:Body>
</soapenv:Envelope>
`;

        try {
            const {response} = await soapRequest({url: url, headers: sampleHeaders, xml: xmlRequest, timeout: 3000}); // Optional timeout parameter(milliseconds)

            const {body} = response;


            if (parser.validate(body) === true) { //optional (it'll return an object in case it's not valid)
                let jsonObj = parser.parse(body, options);
                if (jsonObj.Envelope.Body.CCSCD7_QRYResponse) {
                    let finalResult = [];
                    let regex = /BALANCE_TYPES=(.+?)\|BALANCES=(.+?)\|COSTS=(.+?)\|.*TCS=(.+?)\|TCE=(.+?)\|.*RATING_GROUP=(.+?)\|/;
                    if (jsonObj.Envelope.Body.CCSCD7_QRYResponse.EDRS) {
                        let result = jsonObj['Envelope']['Body']['CCSCD7_QRYResponse']['EDRS']['EDR_ITEM'];

                        if (Array.isArray(result)) {
                            result.forEach(function (edr) {
                                if (!edr.EXTRA_INFORMATION.includes("NACK=INSF")) {

                                    let matches = edr.EXTRA_INFORMATION.matchAll(regex);

                                    for (const el of matches) {
                                        let balance_type = el[1];
                                        let balance_before = el[2];
                                        let cost = el[3];
                                        let start_time = el[4];
                                        let end_time = el[5];

                                        let rating_group = el[6];
                                        if (balance_type.includes(",")) {
                                            let record_date = utils.formateDate(edr.RECORD_DATE);
                                            let f_start_time = utils.formateDate(start_time);
                                            let f_end_time = utils.formateDate(end_time);
                                            let balance_type_items = balance_type.split(",");
                                            let cost_items = cost.split(",");
                                            let balance_before_items = balance_before.split(",");
                                            for (let i = 0; i < balance_type_items.length; i++) {
                                                let edr_info = {};


                                                if (i === 0) {
                                                    edr_info.record_date = record_date;
                                                    edr_info.start_time = f_start_time;
                                                    edr_info.end_time = f_end_time;

                                                } else {
                                                    edr_info.record_date = "";
                                                    edr_info.start_time = "";
                                                    edr_info.end_time = "";

                                                }
                                                edr_info.balance_type = utils.getBundleName(balance_type_items[i]);
                                                edr_info.balance_before = balance_before_items[i];
                                                edr_info.cost = cost_items[i];
                                                edr_info.balance_after = (parseInt(balance_before_items[i]) - parseInt(cost_items[i])).toString()

                                                edr_info.rating_group = rating_group;
                                                finalResult.push(edr_info);

                                            }

                                        } else {
                                            let edr_info = {};
                                            edr_info.record_date = utils.formateDate(edr.RECORD_DATE);
                                            edr_info.start_time = utils.formateDate(start_time);
                                            edr_info.end_time = utils.formateDate(end_time);
                                            edr_info.balance_type = utils.getBundleName(balance_type);
                                            edr_info.balance_before = balance_before;
                                            edr_info.cost = cost;
                                            edr_info.balance_after = (parseInt(balance_before) - parseInt(cost)).toString()

                                            edr_info.rating_group = rating_group;
                                            finalResult.push(edr_info)

                                        }


                                    }

                                }


                            });

                        } else {
                            let edr = result;
                            if (!edr.EXTRA_INFORMATION.includes("NACK=INSF")) {

                                let matches = edr.EXTRA_INFORMATION.matchAll(regex);

                                for (const el of matches) {
                                    let balance_type = el[1];
                                    let balance_before = el[2];
                                    let cost = el[3];
                                    let start_time = el[4];
                                    let end_time = el[5];

                                    let rating_group = el[6];

                                    if (balance_type.includes(",")) {
                                        let record_date = utils.formateDate(edr.RECORD_DATE);
                                        let f_start_time = utils.formateDate(start_time);
                                        let f_end_time = utils.formateDate(end_time);
                                        let balance_type_items = balance_type.split(",");
                                        let cost_items = cost.split(",");
                                        let balance_before_items = balance_before.split(",");
                                        for (let i = 0; i < balance_type_items.length; i++) {
                                            let edr_info = {};


                                            if (i === 0) {
                                                edr_info.record_date = record_date;
                                                edr_info.start_time = f_start_time;
                                                edr_info.end_time = f_end_time;

                                            } else {
                                                edr_info.record_date = "";
                                                edr_info.start_time = "";
                                                edr_info.end_time = "";

                                            }

                                            edr_info.balance_type = utils.getBundleName(balance_type_items[i]);
                                            edr_info.balance_before = balance_before_items[i];
                                            edr_info.cost = cost_items[i];
                                            edr_info.balance_after = (parseInt(balance_before_items[i]) - parseInt(cost_items[i])).toString()

                                            edr_info.rating_group = rating_group;
                                            finalResult.push(edr_info);

                                        }

                                    } else {
                                        let edr_info = {};
                                        edr_info.record_date = utils.formateDate(edr.RECORD_DATE);
                                        edr_info.start_time = utils.formateDate(start_time);
                                        edr_info.end_time = utils.formateDate(end_time);
                                        edr_info.balance_type = utils.getBundleName(balance_type);
                                        edr_info.balance_before = balance_before;
                                        edr_info.cost = cost;
                                        edr_info.balance_after = (parseInt(balance_before) - parseInt(cost)).toString()
                                        edr_info.rating_group = rating_group;
                                        finalResult.push(edr_info)

                                    }


                                }

                            }

                        }


                        return res.json({success: finalResult})

                    } else {
                        return res.json({success: finalResult})
                    }


                } else {
                    let soapFault = jsonObj.Envelope.Body.Fault;
                    let faultString = soapFault.faultstring;
                    console.log(soapFault)
                    return res.json({error: faultString})


                }

            }


        } catch (error) {
            console.log(error.toString())

            res.json({error: "IN not reachable, Please contact IN SysAdmin"})


        }


    },

    postViewHistRecharge: async (req, res) => {


        let {msisdn, begin_date, end_date} = req.body;
        begin_date = moment(begin_date, 'DD-MM-YYYY HH:mm:ss').format("YYYYMMDDHHmmss");
        end_date = moment(end_date, 'DD-MM-YYYY HH:mm:ss').format("YYYYMMDDHHmmss");


        const url = PI_ENDPOINT;
        const sampleHeaders = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'urn:CCSCD7_QRY',
        };

        let xmlRequest = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSCD7_QRY>
         <pi:AUTH/>
         <pi:username>admin</pi:username>
         <pi:password>admin</pi:password>
         <pi:MSISDN>${msisdn}</pi:MSISDN>
         <pi:WALLET_TYPE>Primary</pi:WALLET_TYPE>
         <pi:EDR_TYPE>4|47|49|8</pi:EDR_TYPE>
         <pi:MAX_RECORDS>1000</pi:MAX_RECORDS>
         <pi:DAYS/>
         <pi:START_DATE>${begin_date}</pi:START_DATE>
         <pi:END_DATE>${end_date}</pi:END_DATE>
      </pi:CCSCD7_QRY>
   </soapenv:Body>
</soapenv:Envelope>
`;

        try {
            const {response} = await soapRequest({url: url, headers: sampleHeaders, xml: xmlRequest, timeout: 3000}); // Optional timeout parameter(milliseconds)

            const {body} = response;


            if (parser.validate(body) === true) { //optional (it'll return an object in case it's not valid)
                let jsonObj = parser.parse(body, options);
                if (jsonObj.Envelope.Body.CCSCD7_QRYResponse) {
                    let finalResult = [];

                    if (jsonObj.Envelope.Body.CCSCD7_QRYResponse.EDRS) {
                        let result = jsonObj['Envelope']['Body']['CCSCD7_QRYResponse']['EDRS']['EDR_ITEM'];

                        if (Array.isArray(result)) {
                            result.forEach(function (edr) {
                                let edrType = utils.getEdrType(edr.EDR_TYPE);
                                let record_date = utils.formateDate(edr.RECORD_DATE);

                                let balance_before = (/BALANCES=(.+?)\|/.exec(edr.EXTRA_INFORMATION))[1];
                                let balance_types = (/BALANCE_TYPES=(.+?)\|/.exec(edr.EXTRA_INFORMATION))[1];
                                let cost = (/COSTS=(.+?)\|/.exec(edr.EXTRA_INFORMATION))[1];

                                let transaction_id = "";
                                if (/TRANSACTION/i.test(edr.EXTRA_INFORMATION)) {
                                    transaction_id = (/TRANSACTION_ID=(.+?)\|/.exec(edr.EXTRA_INFORMATION))[1];
                                }

                                let channel = "";
                                if (/CHANNEL/i.test(edr.EXTRA_INFORMATION)) {
                                    channel = (/CHANNEL=(.+?)\|/.exec(edr.EXTRA_INFORMATION))[1];
                                }


                                if (balance_types.includes(",")) {
                                    let balance_type_items = balance_types.split(",");
                                    let cost_items = cost.split(",");
                                    let balance_before_items = balance_before.split(",");

                                    for (let i = 0; i < balance_before_items.length; i++) {
                                        let edr_info = {};


                                        if (i === 0) {
                                            edr_info.record_date = record_date;
                                            edr_info.edrType = edrType;
                                            edr_info.channel = channel;
                                            edr_info.transaction_id = transaction_id

                                        } else {
                                            edr_info.record_date = "";
                                            edr_info.edrType = "";
                                            edr_info.channel = "";
                                            edr_info.transaction_id = "";


                                        }
                                        edr_info.balance_type = appData.balanceTypes[balance_type_items[i]];
                                        if (balance_type_items[i] === '21') {
                                            edr_info.cost = (parseFloat(cost_items[i]) / 100).toFixed(2);
                                            edr_info.balance_before = (parseFloat(balance_before_items[i]) / 100).toFixed(2);
                                            edr_info.balance_after = ((parseFloat(balance_before_items[i]) - parseFloat(cost_items[i])) / 100).toFixed(2);

                                        } else {
                                            edr_info.balance_before = balance_before_items[i];
                                            edr_info.cost = cost_items[i];
                                            edr_info.balance_after = (parseInt(balance_before_items[i]) - parseInt(cost_items[i]));

                                        }

                                        finalResult.push(edr_info);


                                    }

                                } else {
                                    let edr_info = {};
                                    edr_info.edrType = edrType;
                                    edr_info.record_date = record_date;
                                    edr_info.channel = channel;
                                    edr_info.transaction_id = transaction_id
                                    edr_info.balance_type = appData.balanceTypes[balance_types];
                                    if (balance_types === '21') {
                                        edr_info.cost = (parseFloat(cost) / 100).toFixed(2);
                                        edr_info.balance_before = (parseFloat(balance_before) / 100).toFixed(2);
                                        edr_info.balance_after = ((parseFloat(balance_before) - parseFloat(cost)) / 100).toFixed(2);

                                    } else {
                                        edr_info.balance_before = balance_before;
                                        edr_info.cost = cost;
                                        edr_info.balance_after = (parseInt(balance_before) - parseInt(cost));

                                    }

                                    finalResult.push(edr_info)

                                }


                            });

                        } else {
                            let edr = result;
                            let edrType = utils.getEdrType(edr.EDR_TYPE);
                            let record_date = utils.formateDate(edr.RECORD_DATE);

                            let balance_before = (/BALANCES=(.+?)\|/.exec(edr.EXTRA_INFORMATION))[1];
                            let balance_types = (/BALANCE_TYPES=(.+?)\|/.exec(edr.EXTRA_INFORMATION))[1];
                            let cost = (/COSTS=(.+?)\|/.exec(edr.EXTRA_INFORMATION))[1];

                            let transaction_id = "";
                            if (/TRANSACTION/i.test(edr.EXTRA_INFORMATION)) {
                                transaction_id = (/TRANSACTION_ID=(.+?)\|/.exec(edr.EXTRA_INFORMATION))[1];
                            }

                            let channel = "";
                            if (/CHANNEL/i.test(edr.EXTRA_INFORMATION)) {
                                channel = (/CHANNEL=(.+?)\|/.exec(edr.EXTRA_INFORMATION))[1];
                            }


                            if (balance_types.includes(",")) {
                                let balance_type_items = balance_types.split(",");
                                let cost_items = cost.split(",");
                                let balance_before_items = balance_before.split(",");

                                for (let i = 0; i < balance_before_items.length; i++) {
                                    let edr_info = {};


                                    if (i === 0) {
                                        edr_info.record_date = record_date;
                                        edr_info.edrType = edrType;
                                        edr_info.channel = channel;
                                        edr_info.transaction_id = transaction_id

                                    } else {
                                        edr_info.record_date = "";
                                        edr_info.edrType = "";
                                        edr_info.channel = "";
                                        edr_info.transaction_id = "";


                                    }
                                    edr_info.balance_type = appData.balanceTypes[balance_type_items[i]];
                                    if (balance_type_items[i] === '21') {
                                        edr_info.cost = (parseFloat(cost_items[i]) / 100).toFixed(2);
                                        edr_info.balance_before = (parseFloat(balance_before_items[i]) / 100).toFixed(2);
                                        edr_info.balance_after = ((parseFloat(balance_before_items[i]) - parseFloat(cost_items[i])) / 100).toFixed(2);

                                    } else {
                                        edr_info.balance_before = balance_before_items[i];
                                        edr_info.cost = cost_items[i];
                                        edr_info.balance_after = (parseInt(balance_before_items[i]) - parseInt(cost_items[i]));

                                    }

                                    finalResult.push(edr_info);


                                }

                            } else {
                                let edr_info = {};
                                edr_info.edrType = edrType;
                                edr_info.record_date = record_date;
                                edr_info.channel = channel;
                                edr_info.transaction_id = transaction_id
                                edr_info.balance_type = appData.balanceTypes[balance_types];
                                if (balance_types === '21') {
                                    edr_info.cost = (parseFloat(cost) / 100).toFixed(2);
                                    edr_info.balance_before = (parseFloat(balance_before) / 100).toFixed(2);
                                    edr_info.balance_after = ((parseFloat(balance_before) - parseFloat(cost)) / 100).toFixed(2);

                                } else {
                                    edr_info.balance_before = balance_before;
                                    edr_info.cost = cost;
                                    edr_info.balance_after = (parseInt(balance_before) - parseInt(cost));

                                }

                                finalResult.push(edr_info)

                            }


                        }


                        return res.json({success: finalResult})

                    } else {
                        return res.json({success: finalResult})
                    }


                } else {
                    let soapFault = jsonObj.Envelope.Body.Fault;
                    let faultString = soapFault.faultstring;
                    console.log(soapFault)
                    return res.json({error: faultString})


                }

            }


        } catch (error) {
            console.log(error.toString())

            res.json({error: "IN not reachable, Please contact IN SysAdmin"})


        }

    },

    postviewHistEventCharge: async (req, res) => {

        let {msisdn, begin_date, end_date} = req.body;
        begin_date = moment(begin_date, 'DD-MM-YYYY HH:mm:ss').format("YYYYMMDDHHmmss");
        end_date = moment(end_date, 'DD-MM-YYYY HH:mm:ss').format("YYYYMMDDHHmmss");


        const url = PI_ENDPOINT;
        const sampleHeaders = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'urn:CCSCD7_QRY',
        };

        let xmlRequest = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSCD7_QRY>
         <pi:AUTH/>
         <pi:username>admin</pi:username>
         <pi:password>admin</pi:password>
         <pi:MSISDN>${msisdn}</pi:MSISDN>
         <pi:WALLET_TYPE>Primary</pi:WALLET_TYPE>
         <pi:EDR_TYPE>5</pi:EDR_TYPE>
         <pi:MAX_RECORDS>1000</pi:MAX_RECORDS>
         <pi:DAYS/>
         <pi:START_DATE>${begin_date}</pi:START_DATE>
         <pi:END_DATE>${end_date}</pi:END_DATE>
      </pi:CCSCD7_QRY>
   </soapenv:Body>
</soapenv:Envelope>
`;

        try {
            const {response} = await soapRequest({url: url, headers: sampleHeaders, xml: xmlRequest, timeout: 3000}); // Optional timeout parameter(milliseconds)

            const {body} = response;


            if (parser.validate(body) === true) { //optional (it'll return an object in case it's not valid)
                let jsonObj = parser.parse(body, options);
                if (jsonObj.Envelope.Body.CCSCD7_QRYResponse) {
                    let finalResult = [];
                    let regex = /BALANCE_TYPES=(.+?)\|.*BALANCES=(.+?)\|*.COSTS=(.+?)\|/;
                    if (jsonObj.Envelope.Body.CCSCD7_QRYResponse.EDRS) {
                        let result = jsonObj['Envelope']['Body']['CCSCD7_QRYResponse']['EDRS']['EDR_ITEM'];


                        if (Array.isArray(result)) {
                            result.forEach(function (edr) {
                                let edrType = utils.getEdrType(edr.EDR_TYPE);
                                let record_date = utils.formateDate(edr.RECORD_DATE);

                                let matches = edr.EXTRA_INFORMATION.matchAll(regex);
                                for (const el of matches) {
                                    let balance_before = el[2];
                                    let balance_types = el[1];
                                    let cost = el[3];


                                    if (balance_types.includes(",")) {
                                        let balance_type_items = balance_types.split(",");
                                        let cost_items = cost.split(",");
                                        let balance_before_items = balance_before.split(",");

                                        for (let i = 0; i < balance_before_items.length; i++) {
                                            let edr_info = {};

                                            if (i === 0) {
                                                edr_info.record_date = record_date;
                                                edr_info.edrType = edrType;

                                            } else {
                                                edr_info.record_date = "";
                                                edr_info.edrType = "";

                                            }

                                            edr_info.balance_type = appData.balanceTypes[balance_type_items[i]];
                                            if (balance_type_items[i] === '21') {
                                                edr_info.cost = (parseFloat(cost_items[i]) / 100).toFixed(2);
                                                edr_info.balance_before = (parseFloat(balance_before_items[i]) / 100).toFixed(2);
                                                edr_info.balance_after = ((parseFloat(balance_before_items[i]) - parseFloat(cost_items[i])) / 100).toFixed(2);

                                            } else {
                                                edr_info.balance_before = balance_before_items[i];
                                                edr_info.cost = cost_items[i];
                                                edr_info.balance_after = (parseInt(balance_before_items[i]) - parseInt(cost_items[i]));

                                            }

                                            finalResult.push(edr_info);


                                        }

                                    } else {
                                        let edr_info = {};
                                        edr_info.edrType = edrType;
                                        edr_info.record_date = record_date;
                                        edr_info.balance_type = appData.balanceTypes[balance_types];
                                        if (balance_types === '21') {
                                            edr_info.cost = (parseFloat(cost) / 100).toFixed(2);
                                            edr_info.balance_before = (parseFloat(balance_before) / 100).toFixed(2);
                                            edr_info.balance_after = ((parseFloat(balance_before) - parseFloat(cost)) / 100).toFixed(2);

                                        } else {
                                            edr_info.balance_before = balance_before;
                                            edr_info.cost = cost;
                                            edr_info.balance_after = (parseInt(balance_before) - parseInt(cost));

                                        }


                                        finalResult.push(edr_info)

                                    }


                                }


                            });

                        } else {

                            let edr = result;
                            let edrType = utils.getEdrType(edr.EDR_TYPE);
                            let record_date = utils.formateDate(edr.RECORD_DATE);

                            let matches = edr.EXTRA_INFORMATION.matchAll(regex);
                            for (const el of matches) {
                                let balance_before = el[2];
                                let balance_types = el[1];
                                let cost = el[3];

                                if (balance_types.includes(",")) {
                                    let balance_type_items = balance_types.split(",");
                                    let cost_items = cost.split(",");
                                    let balance_before_items = balance_before.split(",");

                                    for (let i = 0; i < balance_before_items.length; i++) {
                                        let edr_info = {};

                                        if (i === 0) {
                                            edr_info.record_date = record_date;
                                            edr_info.edrType = edrType;

                                        } else {
                                            edr_info.record_date = "";
                                            edr_info.edrType = "";

                                        }
                                        edr_info.balance_type = appData.balanceTypes[balance_type_items[i]];
                                        if (balance_type_items[i] === '21') {
                                            edr_info.cost = (parseFloat(cost_items[i]) / 100).toFixed(2);
                                            edr_info.balance_before = (parseFloat(balance_before_items[i]) / 100).toFixed(2);
                                            edr_info.balance_after = ((parseFloat(balance_before_items[i]) - parseFloat(cost_items[i])) / 100).toFixed(2);

                                        } else {
                                            edr_info.balance_before = balance_before_items[i];
                                            edr_info.cost = cost_items[i];
                                            edr_info.balance_after = (parseInt(balance_before_items[i]) - parseInt(cost_items[i]));

                                        }


                                        finalResult.push(edr_info);


                                    }

                                } else {
                                    let edr_info = {};
                                    edr_info.edrType = edrType;
                                    edr_info.record_date = record_date;
                                    edr_info.balance_type = appData.balanceTypes[balance_types];
                                    if (balance_types === '21') {
                                        edr_info.cost = (parseFloat(cost) / 100).toFixed(2);
                                        edr_info.balance_before = (parseFloat(balance_before) / 100).toFixed(2);
                                        edr_info.balance_after = ((parseFloat(balance_before) - parseFloat(cost)) / 100).toFixed(2);

                                    } else {
                                        edr_info.balance_before = balance_before;
                                        edr_info.cost = cost;
                                        edr_info.balance_after = (parseInt(balance_before) - parseInt(cost));

                                    }

                                    finalResult.push(edr_info)

                                }
                            }
                        }


                        return res.json({success: finalResult})

                    } else {
                        return res.json({success: finalResult})
                    }


                } else {
                    let soapFault = jsonObj.Envelope.Body.Fault;
                    let faultString = soapFault.faultstring;
                    console.log(soapFault)
                    return res.json({error: faultString})


                }

            }


        } catch (error) {
            console.log(error.toString())

            res.json({error: "IN not reachable, Please contact IN SysAdmin"})


        }

    },

    postviewHistAll: async (req, res) => {
        let {msisdn, begin_date, end_date} = req.body;
        begin_date = moment(begin_date, 'DD-MM-YYYY HH:mm:ss').format("YYYYMMDDHHmmss");
        end_date = moment(end_date, 'DD-MM-YYYY HH:mm:ss').format("YYYYMMDDHHmmss");


        const url = PI_ENDPOINT;
        const sampleHeaders = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'urn:CCSCD7_QRY',
        };

        let xmlRequest = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSCD7_QRY>
         <pi:AUTH/>
         <pi:username>admin</pi:username>
         <pi:password>admin</pi:password>
         <pi:MSISDN>${msisdn}</pi:MSISDN>
         <pi:WALLET_TYPE>Primary</pi:WALLET_TYPE>
         <pi:MAX_RECORDS>1000</pi:MAX_RECORDS>
         <pi:START_DATE>${begin_date}</pi:START_DATE>
         <pi:END_DATE>${end_date}</pi:END_DATE>
      </pi:CCSCD7_QRY>
   </soapenv:Body>
</soapenv:Envelope>
`;

        const finalResult = [];


        function processEdr(edr) {


            let edrType = utils.getEdrType(edr.EDR_TYPE);
            let record_date = utils.formateDate(edr.RECORD_DATE);
            let extra_info = edr.EXTRA_INFORMATION.toString();

            if (extra_info.includes("BALANCES=") && extra_info.includes("BALANCE_TYPES=") && extra_info.includes("COSTS=")) {

                let balance_before = (/BALANCES=(.+?)\|/.exec(extra_info))[1];
                let balance_types = (/BALANCE_TYPES=(.+?)\|/.exec(extra_info))[1];
                let cost = (/COSTS=(.+?)\|/.exec(extra_info))[1];


                if (balance_types.includes(",")) {
                    let balance_type_items = balance_types.split(",");
                    let cost_items = cost.split(",");
                    let balance_before_items = balance_before.split(",");

                    for (let i = 0; i < balance_before_items.length; i++) {
                        let edr_info = {};

                        if (i === 0) {
                            edr_info.record_date = record_date;
                            edr_info.edrType = edrType;

                        } else {
                            edr_info.record_date = "";
                            edr_info.edrType = "";

                        }
                        edr_info.balance_type = appData.balanceTypes[balance_type_items[i]];
                        if (balance_type_items[i] === '21') {
                            edr_info.cost = (parseFloat(cost_items[i]) / 100).toFixed(2);
                            edr_info.balance_before = (parseFloat(balance_before_items[i]) / 100).toFixed(2);
                            edr_info.balance_after = ((parseFloat(balance_before_items[i]) - parseFloat(cost_items[i])) / 100).toFixed(2);

                        } else {
                            edr_info.balance_before = balance_before_items[i];
                            edr_info.cost = cost_items[i];
                            edr_info.balance_after = (parseInt(balance_before_items[i]) - parseInt(cost_items[i]));

                        }


                        finalResult.push(edr_info);


                    }

                } else {
                    let edr_info = {};
                    edr_info.edrType = edrType;
                    edr_info.record_date = record_date;
                    edr_info.balance_type = appData.balanceTypes[balance_types];
                    if (balance_types === '21') {
                        edr_info.cost = (parseFloat(cost) / 100).toFixed(2);
                        edr_info.balance_before = (parseFloat(balance_before) / 100).toFixed(2);
                        edr_info.balance_after = ((parseFloat(balance_before) - parseFloat(cost)) / 100).toFixed(2);

                    } else {
                        edr_info.balance_before = balance_before;
                        edr_info.cost = cost;
                        edr_info.balance_after = (parseInt(balance_before) - parseInt(cost));

                    }

                    finalResult.push(edr_info)

                }


            } else if (!extra_info.includes("NACK=INS")) {
                let edr_info = {};
                let edrType = utils.getEdrType(edr.EDR_TYPE);
                let record_date = utils.formateDate(edr.RECORD_DATE);

                edr_info.edrType = edrType;
                edr_info.record_date = record_date;
                edr_info.balance_type = "---";
                edr_info.balance_before = "---"
                edr_info.cost = "---";
                edr_info.balance_after = "---";
                finalResult.push(edr_info);

            }


        }

        try {
            const {response} = await soapRequest({url: url, headers: sampleHeaders, xml: xmlRequest, timeout: 4000}); // Optional timeout parameter(milliseconds)

            const {body} = response;


            if (parser.validate(body) === true) { //optional (it'll return an object in case it's not valid)
                let jsonObj = parser.parse(body, options);
                if (jsonObj.Envelope.Body.CCSCD7_QRYResponse) {

                    if (jsonObj.Envelope.Body.CCSCD7_QRYResponse.EDRS) {
                        let result = jsonObj['Envelope']['Body']['CCSCD7_QRYResponse']['EDRS']['EDR_ITEM'];

                        if (Array.isArray(result)) {
                            result.forEach(processEdr);

                        } else {
                            processEdr(result)
                        }

                        return res.json({success: finalResult})

                    } else {
                        return res.json({success: finalResult})
                    }


                } else {
                    let soapFault = jsonObj.Envelope.Body.Fault;
                    let faultString = soapFault.faultstring;
                    console.log(soapFault)
                    return res.json({error: faultString})


                }

            }


        } catch (error) {
            console.log(error.toString())

            res.json({error: "IN not reachable, Please contact IN SysAdmin"})


        }


    },

    renderexpiredata: async (req, res) => {

        const status = {
            sub: "",
            maccount: "active",
            top: "",
            load: "",
            manage: "",
            overscratch: "",
            hist: "",
            act: "",
            tra: "",
        };
        const topNav = {
            expiredata: "active",
            changeacctstate: "",
            changephonecontact: "",
            managerecurrent: "",
            changeproduct: "",
            adjustexpiry: "",
            cashtransfer: "",
        };

        const role = utils.getUserRole(req.user)

        res.render("expiredata", {balanceTypes: appData.balanceTypesArrays, status, topNav, ...role});
    },

    renderaccountstate: async (req, res) => {
        const status = {
            sub: "",
            maccount: "active",
            top: "",
            load: "",
            manage: "",
            overscratch: "",
            hist: "",
            act: "",
            tra: "",
        };
        const topNav = {
            expiredata: "",
            changeacctstate: "active",
            changephonecontact: "",
            managerecurrent: "",
            changeproduct: "",
            adjustexpiry: "",
            cashtransfer: "",
        };
        const role = utils.getUserRole(req.user)

        res.render("changeaccountstate", {status, topNav, ...role});
    },
    renderchangephonecontact: async (req, res) => {
        const status = {
            sub: "",
            maccount: "active",
            top: "",
            load: "",
            manage: "",
            overscratch: "",
            hist: "",
            act: "",
            tra: "",
        };
        const topNav = {
            expiredata: "",
            changeacctstate: "",
            changephonecontact: "active",
            managerecurrent: "",
            changeproduct: "",
            adjustexpiry: "",
            cashtransfer: "",

        };
        const role = utils.getUserRole(req.user)
        res.render("changecontact", {status, topNav, ...role});

    },
    renderchangeproduct: async (req, res) => {

        const status = {
            sub: "",
            maccount: "active",
            top: "",
            load: "",
            manage: "",
            overscratch: "",
            hist: "",
            act: "",
            tra: "",
        };
        const topNav = {
            expiredata: "",
            changeacctstate: "",
            changephonecontact: "",
            managerecurrent: "",
            changeproduct: "active",
            adjustexpiry: "",
            cashtransfer: "",
        };
        const role = utils.getUserRole(req.user)
        res.render("changeproduct", {products: appData.productTypes, status, topNav, ...role});
    },
    renderadjustexpirydate: async (req, res) => {
        const status = {
            sub: "",
            maccount: "active",
            top: "",
            load: "",
            manage: "",
            overscratch: "",
            hist: "",
            act: "",
            tra: "",
        };
        const topNav = {
            expiredata: "",
            changeacctstate: "",
            changephonecontact: "",
            managerecurrent: "",
            changeproduct: "",
            adjustexpiry: "active",
            cashtransfer: "",
        };
        const role = utils.getUserRole(req.user)
        res.render("adjustexpirydate", {balanceTypes: appData.balanceTypesArrays, status, topNav, ...role});
    },

    rendercashtransfer: async (req, res) => {
        const status = {
            sub: "",
            maccount: "active",
            top: "",
            load: "",
            manage: "",
            overscratch: "",
            hist: "",
            act: "",
            tra: "",
        };
        const topNav = {
            expiredata: "",
            changeacctstate: "",
            changephonecontact: "",
            managerecurrent: "",
            changeproduct: "",
            adjustexpiry: "",
            cashtransfer: "active",
        };
        const role = utils.getUserRole(req.user)
        res.render("transfercash", {status, topNav, ...role});
    },

    rendermanagerecurrent: async (req, res) => {
        const status = {
            sub: "",
            maccount: "active",
            top: "",
            load: "",
            manage: "",
            overscratch: "",
            hist: "",
            act: "",
            tra: "",
        };
        const topNav = {
            expiredata: "",
            changeacctstate: "",
            changephonecontact: "",
            managerecurrent: "active",
            changeproduct: "",
            adjustexpiry: "",
            cashtransfer: "",
        };
        const role = utils.getUserRole(req.user)
        res.render("managerecurrentplan", {status, topNav, ...role})


    },

    getmanagerecurrent: async (req, res) => {
        let msisdn = req.query.msisdn;

        const url = PI_ENDPOINT;
        const sampleHeaders = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'urn:CCSCD7_QRY',
        };


        let xmlRequest = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSSC3_QRY>  
         <pi:username>admin</pi:username>
         <pi:password>admin</pi:password>
         <pi:MSISDN>${msisdn}</pi:MSISDN>
      </pi:CCSSC3_QRY>
   </soapenv:Body>
</soapenv:Envelope>
`;


        let finalResult = [];
        try {
            const {response} = await soapRequest({url: url, headers: sampleHeaders, xml: xmlRequest, timeout: 3000}); // Optional timeout parameter(milliseconds)

            const {body} = response;


            if (parser.validate(body) === true) { //optional (it'll return an object in case it's not valid)
                let jsonObj = parser.parse(body, options);

                if (jsonObj.Envelope.Body.CCSSC3_QRYResponse) {
                    if (jsonObj.Envelope.Body.CCSSC3_QRYResponse.CHARGE) {
                        let charges = jsonObj.Envelope.Body.CCSSC3_QRYResponse.CHARGE;
                        let states = jsonObj.Envelope.Body.CCSSC3_QRYResponse.STATE
                        if (Array.isArray(charges)) {
                            for (let i = 0; i < charges.length; i++) {
                                let recurrent_info = {};
                                recurrent_info.name = charges[i];
                                recurrent_info.state = states[i];
                                if (states[i] === 'Active') {
                                    finalResult.push(recurrent_info);
                                }

                            }
                        } else {
                            let recurrent_info = {};
                            recurrent_info.name = charges;
                            recurrent_info.state = states;
                            if (states === 'Active') {
                                finalResult.push(recurrent_info)

                            }


                        }


                    }

                    return res.json({success: finalResult})


                } else {
                    let errormessage = jsonObj.Envelope.Body.Fault.faultstring;
                    return res.json({error: errormessage})
                }


            }


        } catch (e) {
            console.log(e);
            return res.json({error: "IN system error"})


        }


    },


    postchangestate: async (req, res) => {

        const {msisdn, state} = req.body;


        const url = PI_ENDPOINT;
        const sampleHeaders = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'urn:CCSCD1_CHG',
        };


        let txn_id = uuid.v1();
        let user = req.user.username;


        let xmlRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSCD1_CHG>
         <pi:username>admin</pi:username>
         <pi:password>admin</pi:password>
         <pi:MSISDN>${msisdn}</pi:MSISDN>
         <pi:STATUS>${state}</pi:STATUS>
         <pi:WALLET_EXPIRY_DATE></pi:WALLET_EXPIRY_DATE>
         <pi:EXTRA_EDR>TRANSACTION_ID=${txn_id}|CHANNEL=IN_Web|USER=${user}</pi:EXTRA_EDR>
      </pi:CCSCD1_CHG>
   </soapenv:Body>
</soapenv:Envelope>`;

        try {

            const {response} = await soapRequest({
                url: url,
                headers: sampleHeaders,
                xml: xmlRequest,
                timeout: 4000
            });
            const {body} = response;

            let jsonObj = parser.parse(body, options);

            if (jsonObj.Envelope.Body.CCSCD1_CHGResponse && jsonObj.Envelope.Body.CCSCD1_CHGResponse.AUTH) {
                res.json({success: "success"});
                let transaction_details = `msisdn=${msisdn}|new_state=${state}`;
                let transaction_id = txn_id;
                let status = "completed";
                let username = user;
                let transaction_type = "change account state";
                let userlog = new UserLog({
                    username,
                    transaction_id,
                    transaction_type,
                    transaction_details,
                    status
                });
                userlog = await userlog.save();
                if (userlog) {

                } else {
                    console.log("Transaction logging failed")
                }
            } else {
                let errorMessage = jsonObj.Envelope.Body.Fault.faultstring;
                res.json({error: errorMessage})

            }


        } catch (error) {
            console.log(error.toString());
            res.json({error: "IN System Failure"})

        }

    },

    postchangeproduct: async (req, res) => {

        const {msisdn, product} = req.body;

        const url = PI_ENDPOINT;
        const sampleHeaders = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'urn:CCSCD1_CHG',
        };


        let txn_id = uuid.v1();
        let user = req.user.username;


        let xmlRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSCD1_CHG>
         <pi:username>admin</pi:username>
         <pi:password>admin</pi:password>
         <pi:MSISDN>${msisdn}</pi:MSISDN>
         <pi:PRODUCT>${product}</pi:PRODUCT>
         <pi:EXTRA_EDR>TRANSACTION_ID=${txn_id}|CHANNEL=IN_Web|USER=${user}</pi:EXTRA_EDR>
      </pi:CCSCD1_CHG>
   </soapenv:Body>
</soapenv:Envelope>`;

        try {

            const {response} = await soapRequest({
                url: url,
                headers: sampleHeaders,
                xml: xmlRequest,
                timeout: 4000
            });
            const {body} = response;

            let jsonObj = parser.parse(body, options);

            if (jsonObj.Envelope.Body.CCSCD1_CHGResponse && jsonObj.Envelope.Body.CCSCD1_CHGResponse.AUTH) {
                res.json({success: "success"});
                let transaction_details = `msisdn=${msisdn}|service_class=${product}`;
                let transaction_id = txn_id;
                let status = "completed";
                let username = user;
                let transaction_type = "change service class";
                let userlog = new UserLog({
                    username,
                    transaction_id,
                    transaction_type,
                    transaction_details,
                    status
                });
                userlog = await userlog.save();
                if (userlog) {

                } else {
                    console.log("Transaction logging failed")
                }

            } else {
                let errorMessage = jsonObj.Envelope.Body.Fault.faultstring;
                res.json({error: errorMessage})

            }


        } catch (error) {
            console.log(error.toString());
            res.json({error: "IN System Failure"})

        }


    },

    postchangecontact: async (req, res) => {

        let contact_type = 'AltSMSNotifNo';

        const {msisdn, contact, contacttype} = req.body;
        if (contacttype === 'email_type') {
            contact_type = 'EmailID';
            const {error} = validator.validateGeneralEmail({email: contact});
            if (error) {
                return res.json({error: error.message})
            }
        }

        const url = PI_ENDPOINT;
        const sampleHeaders = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'urn:CCSCD1_CHG',
        };


        let txn_id = uuid.v1();
        let user = req.user.username;


        let xmlRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSCD9_CHG>
         <pi:username>admin</pi:username>
         <pi:password>admin</pi:password>
         <pi:MSISDN>${msisdn}</pi:MSISDN>
         <pi:TAG>${contact_type}</pi:TAG>
         <pi:VALUE>${contact}</pi:VALUE>
      </pi:CCSCD9_CHG>
   </soapenv:Body>
</soapenv:Envelope>`;

        try {

            const {response} = await soapRequest({
                url: url,
                headers: sampleHeaders,
                xml: xmlRequest,
                timeout: 4000
            });
            const {body} = response;

            let jsonObj = parser.parse(body, options);

            if (jsonObj.Envelope.Body.CCSCD9_CHGResponse && jsonObj.Envelope.Body.CCSCD9_CHGResponse.AUTH) {
                res.json({success: "success"})
                let transaction_details = `msisdn=${msisdn}|new_contact=${contact}`;
                let transaction_id = txn_id;
                let status = "completed";
                let username = user;
                let transaction_type = "change sms contact";
                let userlog = new UserLog({
                    username,
                    transaction_id,
                    transaction_type,
                    transaction_details,
                    status
                });
                userlog = await userlog.save();
                if (userlog) {

                } else {
                    console.log("Transaction logging failed")
                }
            } else {
                let errorMessage = jsonObj.Envelope.Body.Fault.faultstring;
                res.json({error: errorMessage})

            }


        } catch (error) {
            console.log(error.toString());
            res.json({error: "IN System Failure"})

        }

    },

    postexpiredata: async (req, res) => {

        const {msisdn, balancetype} = req.body;


        const url = PI_ENDPOINT;
        const sampleHeaders = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'urn:CCSCD1_CHG',
        };


        let txn_id = uuid.v1();
        let user = req.user.username;


        let xmlRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSCD1_CHG>
         <pi:username>admin</pi:username>
         <pi:password>admin</pi:password>
         <pi:MSISDN>${msisdn}</pi:MSISDN>
         <pi:BALANCE_TYPE>${balancetype}</pi:BALANCE_TYPE>
         <pi:BALMODE>ABSOLUTE</pi:BALMODE>
         <pi:BALANCE>0</pi:BALANCE>
         <pi:EXTRA_EDR>TRANSACTION_ID=${txn_id}|CHANNEL=IN_Web|USER=${user}</pi:EXTRA_EDR>
      </pi:CCSCD1_CHG>
   </soapenv:Body>
</soapenv:Envelope>`;

        try {

            const {response} = await soapRequest({
                url: url,
                headers: sampleHeaders,
                xml: xmlRequest,
                timeout: 4000
            });
            const {body} = response;

            let jsonObj = parser.parse(body, options);


            if (jsonObj.Envelope.Body.CCSCD1_CHGResponse && jsonObj.Envelope.Body.CCSCD1_CHGResponse.AUTH) {
                res.json({success: "success"})
                let transaction_details = `msisdn=${msisdn}|balance_type=${balancetype}`;
                let transaction_id = txn_id;
                let status = "completed";
                let username = user;
                let transaction_type = "expire data";
                let userlog = new UserLog({
                    username,
                    transaction_id,
                    transaction_type,
                    transaction_details,
                    status
                });
                userlog = await userlog.save();
                if (userlog) {

                } else {
                    console.log("Transaction logging failed")
                }
            } else {
                let errorMessage = jsonObj.Envelope.Body.Fault.faultstring;
                res.json({error: errorMessage})

            }


        } catch (error) {
            console.log(error.toString());
            res.json({error: "IN System Failure"})

        }

    },

    postadjustexpiry: async (req, res) => {

        let {msisdn, balancetype, expirydate} = req.body;

        expirydate = moment(expirydate, 'DD-MM-YYYY HH:mm:ss', "en-GB");

        if (moment(expirydate).isSameOrBefore(moment())) {
            return res.json({error: "Expiry Date should be in the future"})

        }

        expirydate = moment(expirydate).format("YYYYMMDDHHmmss");


        const url = PI_ENDPOINT;
        const sampleHeaders = {
            'User-Agent': 'NodeApp',
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'urn:CCSCD1_CHG',
        };


        let txn_id = uuid.v1();
        let user = req.user.username;


        let xmlRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSCD1_CHG>
         <pi:username>admin</pi:username>
         <pi:password>admin</pi:password>
         <pi:MSISDN>${msisdn}</pi:MSISDN>
         <pi:BALANCE_TYPE>${balancetype}</pi:BALANCE_TYPE>
         <pi:BALANCE_EXPIRY_DATE>${expirydate}</pi:BALANCE_EXPIRY_DATE>
         <pi:EXTRA_EDR>TRANSACTION_ID=${txn_id}|CHANNEL=IN_Web|USER=${user}</pi:EXTRA_EDR>
      </pi:CCSCD1_CHG>
   </soapenv:Body>
</soapenv:Envelope>`;

        try {

            const {response} = await soapRequest({
                url: url,
                headers: sampleHeaders,
                xml: xmlRequest,
                timeout: 4000
            });
            const {body} = response;

            let jsonObj = parser.parse(body, options);

            if (jsonObj.Envelope.Body.CCSCD1_CHGResponse && jsonObj.Envelope.Body.CCSCD1_CHGResponse.AUTH) {
                res.json({success: "success"})
                let transaction_details = `msisdn=${msisdn}|balance_type=${balancetype}|expiry_date=${expirydate}`;
                let transaction_id = txn_id;
                let status = "completed";
                let username = user;
                let transaction_type = "adjust expiry date";
                let userlog = new UserLog({
                    username,
                    transaction_id,
                    transaction_type,
                    transaction_details,
                    status
                });
                userlog = await userlog.save();
                if (userlog) {

                } else {
                    console.log("Transaction logging failed")
                }
            } else {
                let errorMessage = jsonObj.Envelope.Body.Fault.faultstring;
                res.json({error: errorMessage})

            }


        } catch (error) {
            console.log(error.toString());
            res.json({error: "IN System Failure"})

        }

    },

    postterminaterecurrent: async (req, res) => {

        const {msisdn, recurrentplan} = req.body;
        let user = req.user.username;
        let txn_id = uuid.v4();

        try {

            const url = OSD_ENDPOINT;

            const headers = {
                'User-Agent': 'NodeApp',
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': 'http://172.25.39.13/wsdls/Surfline/CustomRecharge/CustomRecharge',
                'Authorization': 'Basic YWlhb3NkMDE6YWlhb3NkMDE='
            };


            const SoapXML = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ter="http://SCLINSMSVM01P/wsdls/Surfline/TerminateRecurrentPlan.wsdl">
   <soapenv:Header/>
   <soapenv:Body>
      <ter:TerminateRecurrentPlanRequest>
         <CC_Calling_Party_Id>${msisdn}</CC_Calling_Party_Id>
         <BundleName>${recurrentplan}</BundleName>
      </ter:TerminateRecurrentPlanRequest>
   </soapenv:Body>
</soapenv:Envelope>`;
            const {response} = await soapRequest({
                url: url,
                headers: headers,
                xml: SoapXML,
                timeout: 4000
            });
            const {body} = response;
            let jsonObj = parser.parse(body, options);
            const soapResponseBody = jsonObj.Envelope.Body;
            if (!soapResponseBody.TerminateRecurrentPlanResult) {
                res.json({success: "success"})
                let transaction_details = `msisdn=${msisdn}|recurrentplan=${recurrentplan}`;
                let username = user;
                let transaction_id = txn_id;
                let status = "completed";
                let transaction_type = "terminate recurrent";
                let userlog = new UserLog({
                    username,
                    transaction_id,
                    transaction_type,
                    transaction_details,
                    status
                });
                userlog = await userlog.save();
                if (userlog) {
                } else {
                    console.log("Transaction logging failed")

                }
            } else {
                let soapFault = jsonObj.Envelope.Body.Fault;
                let faultString = soapFault.faultstring;
                res.json({error: faultString.toString()})
            }


        } catch (error) {

            let errorBody = error.toString();
            let jsonObj = parser.parse(errorBody, options);
            let soapFault = jsonObj.Envelope.Body.Fault;
            let faultString = soapFault.faultstring;
            res.json({error: faultString.toString()})

        }

    },

    postcashtransfer: async (req, res) => {


        try {

            let {from_msisdn, to_msisdn, amount} = req.body;

            const {error} = validator.validateCashTransfer({from_msisdn, to_msisdn, amount});
            if (error) {
                res.json({error: error.message})

            } else {

                amount = amount * 100;

                let isDebitSuccess = false;


                let txn_id = uuid.v4();
                let user = req.user.username;

                const debiturl = PI_ENDPOINT;

                const debitheaders = {
                    'User-Agent': 'NodeApp',
                    'Content-Type': 'text/xml;charset=UTF-8',
                    'SOAPAction': 'urn:CCSCD1_CHG',
                };


                const debitXML = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pi="http://xmlns.oracle.com/communications/ncc/2009/05/15/pi">
   <soapenv:Header/>
   <soapenv:Body>
      <pi:CCSCD1_CHG>
         <pi:username>admin</pi:username>
         <pi:password>admin</pi:password>
         <pi:MSISDN>${from_msisdn}</pi:MSISDN>
         <pi:BALANCE_TYPE>General Cash</pi:BALANCE_TYPE>
         <pi:BALANCE>${amount}</pi:BALANCE>
         <pi:EXTRA_EDR>TRANSACTION_ID=${txn_id}|CHANNEL=IN_Web|POS_USER=${user}</pi:EXTRA_EDR>
      </pi:CCSCD1_CHG>
   </soapenv:Body>
</soapenv:Envelope>`;

                const {response} = await soapRequest({
                    url: debiturl,
                    headers: debitheaders,
                    xml: debitXML,
                    timeout: 4000
                });
                const {body} = response;
                let jsonObj = parser.parse(body, options);

                const soapResponseBody = jsonObj.Envelope.Body;

                if (soapResponseBody.CCSCD1_CHGResponse && soapResponseBody.CCSCD1_CHGResponse.AUTH) {
                    isDebitSuccess = true;
                } else {
                    let soapFault = jsonObj.Envelope.Body.Fault;
                    let faultString = soapFault.faultstring;
                    return res.json({error: faultString.toString()})
                }

                if (isDebitSuccess) {

                    const url = OSD_ENDPOINT;

                    const headers = {
                        'User-Agent': 'NodeApp',
                        'Content-Type': 'text/xml;charset=UTF-8',
                        'SOAPAction': 'http://172.25.39.13/wsdls/Surfline/CustomRecharge/CustomRecharge',
                        'Authorization': 'Basic YWlhb3NkMDE6YWlhb3NkMDE='
                    };


                    const creditXML = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:dat="http://SCLINSMSVM01T/wsdls/Surfline/DataTransferManual.wsdl">
   <soapenv:Header/>
   <soapenv:Body>
      <dat:DataTransferManualRequest>
         <CC_Calling_Party_Id>${to_msisdn}</CC_Calling_Party_Id>
         <Recharge_List_List>
            <Recharge_List>
               <Balance_Type_Name>General Cash</Balance_Type_Name>
               <Recharge_Amount>${amount}</Recharge_Amount>
               <Balance_Expiry_Extension_Period></Balance_Expiry_Extension_Period>
               <Balance_Expiry_Extension_Policy></Balance_Expiry_Extension_Policy>
               <Bucket_Creation_Policy></Bucket_Creation_Policy>
               <Balance_Expiry_Extension_Type></Balance_Expiry_Extension_Type>
            </Recharge_List>
         </Recharge_List_List>
         <CHANNEL>IN_Web</CHANNEL>
         <TRANSACTION_ID>${txn_id}</TRANSACTION_ID>
         <POS_USER>${user}</POS_USER>
      </dat:DataTransferManualRequest>
   </soapenv:Body>
</soapenv:Envelope>`;
                    const {response} = await soapRequest({
                        url: url,
                        headers: headers,
                        xml: creditXML,
                        timeout: 4000
                    });
                    const {body} = response;
                    let jsonObj = parser.parse(body, options);
                    const soapResponseBody = jsonObj.Envelope.Body;
                    if (!soapResponseBody.DataTransferManualResult) {
                        res.json({success: "success"})
                        let transaction_details = `to_msisdn=${to_msisdn}|from_msisdn=${from_msisdn}|amount=${amount}`;
                        let username = user;
                        let transaction_id = txn_id;
                        let status = "completed";
                        let transaction_type = "cash transfer";
                        let userlog = new UserLog({
                            username,
                            transaction_id,
                            transaction_type,
                            transaction_details,
                            status
                        });
                        userlog = await userlog.save();
                        if (userlog) {
                        } else {
                            console.log("Transaction logging failed")

                        }
                    } else {
                        let soapFault = jsonObj.Envelope.Body.Fault;
                        let faultString = soapFault.faultstring;
                        res.json({error: faultString.toString()})
                    }
                } else {
                    res.json({error: "Error occurred during debit"})
                }

            }


        } catch (error) {
            let errorBody = error.toString();
            let jsonObj = parser.parse(errorBody, options);
            let soapFault = jsonObj.Envelope.Body.Fault;
            let faultString = soapFault.faultstring;
            res.json({error: faultString.toString()})


        }


    },

    postcreateuser: async (req, res) => {

        try {
            const {error} = validator.validateCreateUser(req.body);
            if (error) {

                res.json({error: error.message})

            } else {
                let {username, email, password, firstname, lastname, role} = req.body;
                console.log(req.body)
                let originalpass = password;
                let salt = await bcrypt.genSalt(10);
                password = await bcrypt.hash(password, salt);
                let user = new User({
                    username, email, password, firstname, lastname, role
                });
                user = await user.save();
                if (user) {
                    let usercreater = req.user.username;
                    return sendMail.sendCreateEmail(firstname, email, res, username, originalpass, usercreater, role);

                }
            }
        } catch (e) {
            console.log(e);
            res.json({error: "System Error, Account creation failed. Username/Email already exist"})
        }


    },
    getlogout: async (req, res) => {
        req.logout();
        req.session.destroy(function (error) {
            res.redirect("/login");

        })


    },

    postForgetPasswd: async (req, res) => {

        const {email} = req.body;

        const {error} = validator.validateEmail({email});
        if (error) {
            return res.json({error: "Email address is not a valid Surfline email id"})
        } else {
            const user = await User.findOne({email: email.toLowerCase()});
            if (user) {
                let first_name = user.firstname;
                let to_email = user.email;
                let username = user.username;
                let id = uuid.v4();
                let useruuid = new UserUUID({
                    email: to_email,
                    uuid: id,
                });
                useruuid = await useruuid.save();
                if (useruuid) {
                    let url_link = `http://${HOST}:${process.env.PORT}/reset/${id}`;
                    return sendMail.sendResetEmail(first_name, to_email, url_link, res, username);
                }
            } else {
                return res.json({error: "Email address is not registered"});

            }


        }


    },
    renderResetpasswd: async (req, res) => {
        let uuid = req.params.uuid;
        if (uuid) {
            let useruid = await UserUUID.findOne({uuid: uuid});
            if (useruid) {
                return res.render("reset_passwd", {id: uuid});
            }
        }
        res.render("404_error");

    },

    postResetpasswd: async (req, res) => {

        try {

            let {uuid, password, password2} = req.body;
            let txn_id = require("uuid").v4();
            const {error} = validator.validateResetPasswd({password, password2});
            if (error) {

                res.json({error: error.message})

            } else {
                if (uuid) {
                    let userUuid = await UserUUID.findOne({uuid: uuid});
                    if (userUuid) {
                        let user = await User.findOne({email: userUuid.email});
                        if (user) {
                            user.password = await bcrypt.hash(password2, await bcrypt.genSalt(10));
                            user = await user.save();
                            if (user) {
                                await UserUUID.deleteOne({uuid: uuid});
                                res.json({success: "success"});
                                let username = user.username;
                                let transaction_details = `username=${username}|email=${user.email}|uuid=${uuid}`;
                                let transaction_id = txn_id;
                                let status = "completed";
                                let transaction_type = "password reset";
                                let userlog = new UserLog({
                                    username,
                                    transaction_id,
                                    transaction_type,
                                    transaction_details,
                                    status
                                });
                                userlog = await userlog.save();
                                if (userlog) {

                                } else {
                                    console.log("Transaction logging failed")
                                }
                            }

                        }
                    } else {
                        return res.json({error: "Bad Request"});

                    }


                }
            }

        } catch (error) {
            console.log(error);
            res.json({error: "System Error,Please Try Again"})
        }
    },
    renderChangePass: async (req, res) => {
        res.render("change_passwd")


    },
    postChangePass: async (req, res) => {
        let {oldpassword, password2} = req.body;
        let txn_id = uuid.v4();
        try {
            const {error} = validator.validateChangePasswd(req.body);
            if (error) {
                res.json({error: error.message})

            } else {
                let user = await User.findOne({email: req.user.email});
                let isValid = await bcrypt.compare(oldpassword, user.password);
                if (isValid) {
                    user.password = await bcrypt.hash(password2, (await bcrypt.genSalt(10)));
                    user = await user.save();
                    if (user) {
                        res.json({success: "success"})
                        let username = user.username;
                        let transaction_details = `username=${username}|oldpasswod=|newpassword=`;
                        let transaction_id = txn_id;
                        let status = "completed";
                        let transaction_type = "password change";
                        let userlog = new UserLog({
                            username,
                            transaction_id,
                            transaction_type,
                            transaction_details,
                            status
                        });
                        userlog = await userlog.save();
                        if (userlog) {

                        } else {
                            console.log("Transaction logging failed")
                        }

                        req.logOut();
                        req.session.destroy(function (error) {
                            if (error) {
                                console.log(error)
                            }
                        })


                    } else {
                        res.json({error: "System Failure, Password could not update"})
                    }


                } else {
                    res.json({error: "Incorrect password provided"})
                }


            }

        } catch (error) {
            res.json({error: "Incorrect password provided"})

        }

    }


}
