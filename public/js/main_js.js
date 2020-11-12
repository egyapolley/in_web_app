$(function () {

    const search_form = document.getElementById("search-form");
    const msisdn_input = document.getElementById("msisdn");
    const balanceTbody = document.getElementById("balance-table-tbody");
    const acctInfoTbody = document.getElementById("acct-info-table-tbody");
    const acctTagTbody = document.getElementById("tags-table-tbody");

    const sessionMsisdnEl = document.getElementById("session-msisdn");

    const dashBody = document.getElementById("dash-body");
    const dashboardErrorWrapper = document.getElementById("dashboard-error");
    const dashboardMessage = document.querySelector("#dashboard-error>small");

    const refreshBtn = document.getElementById("refresh-btn");


    if (search_form) {
        search_form.addEventListener("submit", function (event) {
            event.preventDefault();
            dashboardErrorWrapper.style.display = "none";
            let msisdn = msisdn_input.value;
            const progressIndicator = document.getElementById("progressIndicator-dashboard");
            progressIndicator.style.display = "block";

            $.get("/balance", {msisdn})
                .done(function (data) {

                    if (data.error) {
                        dashboardMessage.innerText = data.error;
                        progressIndicator.style.display = "none";
                        dashboardErrorWrapper.style.display = "block";


                    } else {
                        console.log(data)

                        if (data.balances) {
                            let balances = data.balances;

                            let row = "";
                            balances.forEach(function (item) {
                                console.log(item)
                                if (item.balance_type.endsWith("Cash")) {
                                    row = row + `<tr><td>${item.balance_type}</td><td class="balance_value">&#162;&nbsp;${new Intl.NumberFormat("en-US").format(item.value / 100)}</td><td>${item.expiry_date}</td></tr>`;

                                } else if (item.balance_type.endsWith("Data")) {
                                    row = row + `<tr><td>${item.balance_type}</td><td class="balance_value">${new Intl.NumberFormat("en-US").format((item.value / 1024).toFixed(3))} MB</td><td>${item.expiry_date}</td></tr>`;
                                } else {
                                    row = row + `<tr><td>${item.balance_type}</td><td class="balance_value">${item.value}</td><td>${item.expiry_date}</td></tr>`;

                                }

                            });

                            balanceTbody.innerHTML = row;
                        }

                        if (data.general_acct) {
                            let acct_info = data.general_acct;
                            let row = "";
                            acct_info.forEach(function (item) {
                                row = row + `<tr><td>${item.parameterName}&nbsp; :</td><td>${item.parameterValue}</td></tr>`;
                            });

                            acctInfoTbody.innerHTML = row;


                        }

                        if (data.acct_tags) {
                            let acct_info = data.acct_tags;
                            let row = "";
                            acct_info.forEach(function (item) {
                                row = row + `<tr><td>${item.parameterName}&nbsp; :</td><td>${item.parameterValue}</td></tr>`;
                            });

                            acctTagTbody.innerHTML = row;


                        }

                        // $(dashBody).show(200);
                        //dashBody.style.display = "block";
                        progressIndicator.style.display = "none";
                        $(dashBody).show(200);
                        sessionMsisdnEl.innerText = msisdn;
                        sessionMsisdnEl.style.display = "block";
                        msisdn_input.value = "";

                    }


                })
                .fail(function (error) {
                    throw error;

                })


        })
    }

    if (refreshBtn) {
        refreshBtn.addEventListener("click", function (event) {
            if (sessionMsisdnEl.innerText.toString()) {
                event.preventDefault();

                dashboardErrorWrapper.style.display = "none";
                let msisdn = sessionMsisdnEl.innerText.toString()
                const progressIndicator = document.getElementById("progressIndicator-dashboard");
                progressIndicator.style.display = "block";

                $.get("/balance", {msisdn})
                    .done(function (data) {

                        if (data.error) {
                            dashboardMessage.innerText = data.error;
                            progressIndicator.style.display = "none";
                            dashboardErrorWrapper.style.display = "block";


                        } else {


                            if (data.balances) {
                                let balances = data.balances;

                                let row = "";
                                balances.forEach(function (item) {
                                    console.log(item)
                                    if (item.balance_type.endsWith("Cash")) {
                                        row = row + `<tr><td>${item.balance_type}</td><td class="balance_value">&#162;&nbsp;${new Intl.NumberFormat("en-US").format(item.value / 100)}</td><td>${item.expiry_date}</td></tr>`;

                                    } else if (item.balance_type.endsWith("Data")) {
                                        row = row + `<tr><td>${item.balance_type}</td><td class="balance_value">${new Intl.NumberFormat("en-US").format((item.value / 1024).toFixed(3))} MB</td><td>${item.expiry_date}</td></tr>`;
                                    } else {
                                        row = row + `<tr><td>${item.balance_type}</td><td class="balance_value">${item.value}</td><td>${item.expiry_date}</td></tr>`;

                                    }

                                });

                                balanceTbody.innerHTML = row;
                            }

                            if (data.general_acct) {
                                let acct_info = data.general_acct;
                                let row = "";
                                acct_info.forEach(function (item) {
                                    row = row + `<tr><td>${item.parameterName}&nbsp; :</td><td>${item.parameterValue}</td></tr>`;
                                });

                                acctInfoTbody.innerHTML = row;


                            }

                            if (data.acct_tags) {
                                let acct_info = data.acct_tags;
                                let row = "";
                                acct_info.forEach(function (item) {
                                    row = row + `<tr><td>${item.parameterName}&nbsp; :</td><td>${item.parameterValue}</td></tr>`;
                                });

                                acctTagTbody.innerHTML = row;


                            }

                            // $(dashBody).show(200);
                            //dashBody.style.display = "block";
                            progressIndicator.style.display = "none";
                            $(dashBody).show(200);
                            sessionMsisdnEl.innerText = msisdn;
                            sessionMsisdnEl.style.display = "block";
                            msisdn_input.value = "";

                        }


                    })
                    .fail(function (error) {
                        throw error;

                    })


            }

        })
    }


    /* ----------- Top-up---------------*/

    const msisdnTopup = document.getElementById("msisdn-topup");
    const bundleCategoryList = document.getElementById("bundle-category-list");
    const bundleCategoryFieldset = document.getElementById("bundle-category-fieldset");
    const reasonFieldset = document.getElementById("reason-fieldset");
    const allTableContainer = document.getElementById("bundle-tables-container");
    const progressIndicatorBundles = document.getElementById("progessIndicator");

    const bundletablesContainer = document.getElementById("bundle-tables-container");

    const loadbundleErrorWrapper = document.getElementById("loadbundles-error");
    const loadbundleErrorMessage = document.querySelector("#loadbundles-error small")

    const successBundleTopWrapper = document.getElementById("loadbundles-success");
    const successBundleTopMessage = document.querySelector("#loadbundles-success >small");

    const dialogbox_bundlename = document.getElementById("topup-dialog-bdlname");
    const dialogbox_msisdn = document.getElementById("topup-dialog-msisdn");
    const dialogbox_reason = document.getElementById("topup-dialog-reason");
    const dialog_overlay = document.getElementById("top-up-overlay");

    const okBotton = document.getElementById("ok-btn");
    const cancelBotton = document.getElementById("cancel-btn");

    if (msisdnTopup) {
        msisdnTopup.addEventListener("input", function (event) {
            const msisdn = msisdnTopup.value;
            if (msisdn.length !== 12) {
            } else {
                progressIndicatorBundles.style.display = "block";
                loadbundleErrorWrapper.style.display = "none";
                successBundleTopWrapper.style.display = "none";
                $.get("/bundles", {msisdn})
                    .done(function (data) {
                        if (data.dataSet) {
                            let categoriesString = "";
                            let alltablesString = "";
                            for (let bundle of data.dataSet) {
                                let temp_cat = `<li><label class="bundle-cat ${bundle.category.active}" id="${bundle.category.id}"><input type="radio" name="reason">${bundle.category.name}</label></li>`;
                                categoriesString += temp_cat;

                                let tablerow = "";
                                for (let bundleEl of bundle.category.bundles) {
                                    let recurrentbtn = "";
                                    let oneOffbtn = `<button class="one-time-btn" type="button" data-bdlId="${bundleEl.bundleId}" data-bdlname="${bundleEl.bundle_name}" data-msisdn="${msisdn}" data-subtype="One-Off">One-Time</button>`;
                                    if (bundleEl.recurrent === "Recurrent") {
                                        recurrentbtn = `<button class="recurrent-btn" type="button" data-bdlId="${bundleEl.bundleId}" data-bdlname="${bundleEl.bundle_name}" data-msisdn="${msisdn}" data-subtype="Recurrent">Recurrent</button>`;
                                    }
                                    tablerow += `<tr><td>${bundleEl.bundle_name}</td><td>&#162;&nbsp;${bundleEl.price}</td><td>${bundleEl.validity}</td><td>${oneOffbtn}</td><td>${recurrentbtn}</td>`;
                                }


                                let tableString = "";
                                if (bundle.category.active.length > 0) {
                                    tableString = `<table class="bundle-table ${bundle.category.id} active-table"> <thead> <tr> <th>Bundle Name</th> <th>Price</th> <th>Validity</th> <th colspan="2">Subscription Type</th> </tr></thead> <tbody>${tablerow}</tbody> </table>`;
                                } else {
                                    tableString = `<table class="bundle-table ${bundle.category.id}"> <thead> <tr> <th>Bundle Name</th> <th>Price</th> <th>Validity</th> <th colspan="2">Subscription Type</th> </tr></thead> <tbody>${tablerow}</tbody> </table>`;
                                }


                                alltablesString += tableString;
                            }


                            allTableContainer.innerHTML = alltablesString;
                            bundleCategoryList.innerHTML = categoriesString;
                            progressIndicatorBundles.style.display = "none";
                            reasonFieldset.style.display = "block";
                            $(bundleCategoryFieldset).show(200);

                            let mainButton = null;

                            const tablebuttons = document.querySelectorAll(".bundle-table button");
                            if (tablebuttons) {
                                tablebuttons.forEach(function (button) {

                                    button.addEventListener("click", function (event) {
                                        mainButton = event.target;
                                        event.preventDefault();
                                        successBundleTopWrapper.style.display = "none";
                                        loadbundleErrorWrapper.style.display = "none";
                                        let reasonInput = document.querySelector('input[name="reason"]:checked')
                                        const reasonError = document.getElementById("reason-error");
                                        if (!reasonInput || (reasonInput.value === "on")) {

                                            reasonError.style.display = "inline-block";
                                        } else {
                                            reasonError.style.display = "none";
                                            let reasonValue = reasonInput.value;
                                            mainButton.dataset.reasonvalue = reasonValue;

                                            if (dialogbox_bundlename && dialogbox_msisdn && dialog_overlay && dialogbox_reason) {
                                                const {bdlname, bdlid, msisdn} = this.dataset;
                                                dialogbox_bundlename.innerText = bdlname;
                                                dialogbox_bundlename.dataset.bdlid = bdlid;
                                                dialogbox_msisdn.innerText = msisdn;
                                                dialogbox_reason.innerText = reasonValue;
                                                dialog_overlay.style.display = "block";

                                            }


                                        }


                                    })

                                })

                            }

                            if (cancelBotton && okBotton) {

                                cancelBotton.addEventListener("click", function (event) {
                                    dialog_overlay.style.display = "none";
                                    successBundleTopWrapper.style.display = "none";
                                    loadbundleErrorWrapper.style.display = "none";


                                });

                                okBotton.addEventListener("click", function (event) {


                                    progressIndicatorBundles.style.display = "block";
                                    successBundleTopWrapper.style.display = "none";
                                    loadbundleErrorWrapper.style.display = "none";
                                    const postbody = {
                                        msisdn: mainButton.dataset.msisdn,
                                        bdlid: mainButton.dataset.bdlid,
                                        subtype: mainButton.dataset.subtype,
                                        reason: mainButton.dataset.reasonvalue,
                                    };

                                    $.post("/bundle", postbody)
                                        .done(function (data) {
                                            progressIndicatorBundles.style.display = "none";
                                            if (data.success) {
                                                loadbundleErrorWrapper.style.display = "none";
                                                successBundleTopMessage.innerText = "Success";
                                                dialog_overlay.style.display = "none";
                                                $(successBundleTopWrapper).show(100);
                                                successBundleTopWrapper.scrollIntoView();

                                            } else {
                                                loadbundleErrorMessage.innerText = data.error;
                                                successBundleTopWrapper.style.display = "none";
                                                dialog_overlay.style.display = "none";
                                                $(loadbundleErrorWrapper).show(100);
                                                loadbundleErrorWrapper.scrollIntoView();


                                            }

                                        }).fail(function (error) {
                                        progressIndicatorBundles.style.display = "none";
                                        loadbundleErrorMessage.innerText = error.toString();
                                        dialog_overlay.style.display = "none";
                                        $(loadbundleErrorWrapper).show(100);
                                        loadbundleErrorWrapper.scrollIntoView();


                                    });


                                })

                            }


                            const catRadios = document.querySelectorAll(".bundle-cat input");
                            catRadios.forEach(function (radio) {
                                radio.addEventListener("click", function (event) {


                                    if (this.checked) {
                                        const catlabel = this.closest(".bundle-cat");

                                        let catid = catlabel.id;
                                        let tablecat = document.querySelectorAll("." + catid)[0];
                                        tablecat.classList.remove("active-table")
                                        tablecat.style.display = "table";


                                        catlabel.style.background = "#e91e63";
                                        catlabel.style.color = "#fff";
                                    }

                                    catRadios.forEach(function (radio) {
                                        const catlabel = radio.closest(".bundle-cat");
                                        catlabel.classList.remove("active");
                                        if (!radio.checked) {
                                            let catid = catlabel.id;
                                            let tablecat = document.querySelectorAll("." + catid)[0];
                                            tablecat.classList.remove("active-table")
                                            tablecat.style.display = "none";


                                            catlabel.style.background = "";
                                            catlabel.style.color = "";
                                        }


                                    })


                                })


                            });

                            const reasonRadios = document.querySelectorAll('.reason-list input[type="radio"]');
                            reasonRadios.forEach(function (reasonRadio) {
                                reasonRadio.addEventListener("click", function (event) {
                                    const reasonErrorMessage = document.getElementById("reason-error");
                                    reasonErrorMessage.style.display = "none";


                                })

                            })

                        } else {
                            loadbundleErrorMessage.innerText = data.error;
                            loadbundleErrorWrapper.style.display = "block";
                            progressIndicatorBundles.style.display = "none";
                            bundleCategoryFieldset.style.display = "none";
                            reasonFieldset.style.display = "none";
                            bundletablesContainer.innerHTML = "";

                        }


                    })
                    .fail(function (error) {
                        throw error;

                    })


            }


        })


    }

    if (msisdnTopup){
        msisdnTopup.addEventListener("blur", function (event) {
            const msisdn = msisdnTopup.value;
            if (msisdn.length < 12 ){

                progressIndicatorBundles.style.display = "none";
                loadbundleErrorMessage.innerText = `${msisdn} is Invalid. Number should start with 233`;
                //dialog_overlay.style.display = "none";
                $(loadbundleErrorWrapper).show(100);
                loadbundleErrorWrapper.scrollIntoView();

            }

        })

    }

    /* ----- Load Card ------ */
    const loadcardForm = document.getElementById("load-card-form");
    const successMessageWrapper = document.getElementById("manageVoucher-success");
    const successMessage = document.querySelector("#manageVoucher-success >small");
    const errorMessageWrapperLoad = document.getElementById("manageVoucher-error");
    const errorMessageLoadcard = document.querySelector("#manageVoucher-error>small");

    const timeButtonError = document.getElementById("times-button-error");
    if (timeButtonError) {
        timeButtonError.addEventListener("click", function (event) {
            const wrapper = timeButtonError.closest("div");
            wrapper.style.display = "none";

        })
    }

    const timeButtonSuccess = document.getElementById("times-button-success");
    if (timeButtonSuccess) {
        timeButtonSuccess.addEventListener("click", function (event) {
            const wrapper = timeButtonSuccess.closest("div");
            wrapper.style.display = "none";

        })

    }


    if (loadcardForm) {
        loadcardForm.addEventListener("submit", function (event) {
            errorMessageWrapperLoad.style.display = "none";
            successMessageWrapper.style.display = "none";

            event.preventDefault();

            const msisdnInput = document.getElementById("msisdn-loadcard");
            const pinInput = document.getElementById("pin-loadcard");
            const progressIndicator = document.getElementById("progressIndicator-loadcard");
            if (msisdnInput && pinInput) {
                const msisdn = msisdnInput.value;
                const pin = pinInput.value;
                progressIndicator.style.display = "block";

                $.post("/loadcard", {msisdn, pin})
                    .done(function (data) {
                        if (data) {
                            progressIndicator.style.display = "none";
                            if (data.success) {
                                errorMessageWrapperLoad.style.display = "none";
                                successMessage.innerText = "Success";
                                successMessageWrapper.style.display = "block";

                            } else {
                                successMessageWrapper.style.display = "none";
                                errorMessageLoadcard.innerText = data.error;
                                errorMessageWrapperLoad.style.display = "block";

                            }


                        }


                    }).fail(function (error) {

                    successMessageWrapper.style.display = "none";
                    progressIndicator.style.display = "none";
                    errorMessageLoadcard.innerText = error.toString();
                    errorMessageWrapperLoad.style.display = "block";

                })


            }

        })
    }

    /* ----- Manage Voucher ----- */
    const manageVoucherForm = document.getElementById("check-voucher-form");
    const divwrapper = document.getElementById("manage-voucher-info");
    const divwrapperContaier = document.getElementById("manage-voucher-info-container");
    const errorManageVoucherWrapper = document.getElementById("manageVoucher-error");
    const errorMessageManageVoucher = document.querySelector("#manageVoucher-error > small")


    $(divwrapperContaier).hide(0);
    if (manageVoucherForm) {
        manageVoucherForm.addEventListener("submit", function (event) {
            errorManageVoucherWrapper.style.display = "none";
            event.preventDefault();
            const serialManageV = document.getElementById("serial-voucher");
            const progressIndicator = document.getElementById("progressIndicator-manageVoucher");
            if (serialManageV) {
                progressIndicator.style.display = "block";
                const serial = serialManageV.value;
                $.post("/manageVoucher", {serial})
                    .done(function (data) {
                        if (data.success) {

                            const {v_status, v_serial, v_pin, v_msisdn, v_redeemed_date, v_type, v_activation_date, v_expiration_date, v_description} = data.success;

                            divwrapper.innerHTML = `<div class="manage-voucher-info__item"> <ul> <li><span class="pname">Status:</span><span class="pvalue">${v_status}</span></li> <li><span class="pname">Voucher Serial:</span><span class="pvalue">${v_serial}</span></li> <li><span class="pname">Voucher PIN:</span><span class="pvalue">${v_pin}</span></li></ul> </div> <div class="manage-voucher-info__item"> <ul> <li><span class="pname">Subscriber Msisdn:</span><span class="pvalue">${v_msisdn}</span></li> <li><span class="pname">Redeemed Date:</span><span class="pvalue">${v_redeemed_date}</span></li> <li><span class="pname">Voucher Type:</span><span class="pvalue">${v_type}</span></li> </ul> </div> <div class="manage-voucher-info__item" id="manage-voucher-info__item__last"> <ul> <li><span class="pname">Activation Date:</span><span class="pvalue">${v_activation_date}</span></li> <li><span class="pname">Expiration Date:</span><span class="pvalue">${v_expiration_date}</span></li> <li><span class="pname">Description:</span><span class="pvalue">${v_description}</span></li> </ul> </div>`;
                            const updateVoucherStatus = document.getElementById("update-voucher-status");
                            if (updateVoucherStatus) {
                                updateVoucherStatus.dataset.v_serial = v_serial;
                                updateVoucherStatus.dataset.v_pin = v_pin;
                                updateVoucherStatus.dataset.v_status = v_status;
                            }
                            progressIndicator.style.display = "none";
                            $(divwrapperContaier).show(300);

                        } else {
                            console.log(data.error)
                            progressIndicator.style.display = "none";
                            errorMessageManageVoucher.innerText = data.error.message;
                            errorManageVoucherWrapper.style.display = "block"


                        }


                    }).fail(function (error) {
                    console.log(error);
                    progressIndicator.style.display = "none";
                    errorMessageManageVoucher.innerText = error.toString();
                    errorManageVoucherWrapper.style.display = "block"


                })

            }

        })
    }


    /*.....Overscratch Topup.........*/

    const errorWrapperoverscratch = document.getElementById("oversratch-topup-error");
    const errorMessageoverscratch = document.querySelector("#oversratch-topup-error >small");

    const successWrapperoverscratch = document.getElementById("oversratch-topup-success");
    const successMessageoverscratch = document.querySelector("#oversratch-topup-success>small");


    const overscratchForm = document.getElementById("oversratch-topup-form");
    if (overscratchForm) {
        overscratchForm.addEventListener("submit", function (event) {
            event.preventDefault();
            const progressIndicatorOver = document.getElementById("progressIndicator-overscratch");
            progressIndicatorOver.style.display = "block";

            const msisdnInput = document.getElementById("msisdn-overscratch");
            const serialInput = document.getElementById("oversratchserial");

            if (msisdnInput && serialInput) {
                let msisdn = msisdnInput.value;
                let serial = serialInput.value;
                if (msisdn && serial) {
                    $.post("/overscratchtop", {msisdn, serial})
                        .done(function (data) {
                            if (data) {
                                progressIndicatorOver.style.display = "none";
                                if (data.success) {
                                    errorWrapperoverscratch.style.display = "none";
                                    successMessageoverscratch.innerText = "Success";
                                    successWrapperoverscratch.style.display = "block";


                                } else {
                                    errorMessageoverscratch.innerText = data.error;
                                    successWrapperoverscratch.style.display = "none";
                                    errorWrapperoverscratch.style.display = "block";


                                }


                            }


                        }).fail(function (error) {
                        progressIndicatorOver.style.display = "none";
                        errorMessageoverscratch.innerText = error.toString();
                        successWrapperoverscratch.style.display = "none";
                        errorWrapperoverscratch.style.display = "block";


                    })

                } else {
                    progressIndicatorOver.style.display = "none";
                    errorMessageoverscratch.innerText = "Please provide input values"
                    errorWrapperoverscratch.style.display = "block";

                }


            }

        })

    }


    /*.....Transfer Page.......*/

    const progressIndicatorTransfer = document.getElementById("progressIndicatorTransfer");
    const errorWrapperTransfer = document.getElementById("transfer-error");
    const errorMessageTransfer = document.querySelector("#transfer-error>small");

    const successWrapperTransfer = document.getElementById("transfer-success");
    const successMessageTransfer = document.querySelector("#transfer-success>small");


    const transferForm = document.getElementById("transfer-form");
    if (transferForm) {
        transferForm.addEventListener("submit", function (event) {
            event.preventDefault();

            successWrapperTransfer.style.display = "none";
            errorWrapperTransfer.style.display = "none";
            progressIndicatorTransfer.style.display = "block";

            const from_msisdn = document.getElementById("from-msisdn").value;
            const amount = document.getElementById("from-amount").value;
            const from_bundle = document.getElementById("from-bundle").value;

            const to_msisdn = document.getElementById("to-msisdn").value;
            const to_bundle = document.getElementById("to-bundle").value;

            let validity_type;

            const validity = document.getElementById("to-validity").value;
            if (validity) {
                validity_type = document.querySelector('input[name="period-transfer"]:checked').value
            }

            $.post("/transfer", {from_msisdn, amount, from_bundle, to_msisdn, to_bundle, validity, validity_type})
                .done(function (data) {
                    if (data) {
                        progressIndicatorTransfer.style.display = "none";
                        if (data.success) {


                            errorWrapperTransfer.style.display = "none";
                            successMessageTransfer.innerText = "Success";
                            successWrapperTransfer.style.display = "block";


                        } else {

                            errorMessageTransfer.innerText = data.error;
                            successWrapperTransfer.style.display = "none";
                            errorWrapperTransfer.style.display = "block";


                        }


                    }


                }).fail(function (error) {
                console.log(error);
                progressIndicatorTransfer.style.display = "none";
                errorMessageTransfer.innerText = error.toString();
                successWrapperTransfer.style.display = "none";
                errorWrapperTransfer.style.display = "block";


            })


        })

    }

    const setExpiryCheckBox = document.getElementById("setexpiry");
    const validityDetils =document.getElementById("validity-details");
    const validityTo = document.getElementById("to-validity")
    if (setExpiryCheckBox){
        setExpiryCheckBox.addEventListener("click", function (event) {
            if (event.target.checked){
                validityDetils.style.display = "block";
                validityTo.setAttribute("required","");


            }else {
                validityDetils.style.display = "none";
                validityTo.removeAttribute("required");

            }

        })
    }


    /* ...................Account Activate .................*/
    const activateForm = document.getElementById("activate-form");

    const errorWrapperActivate = document.getElementById("activate-error");
    const errorMessageActivate = document.querySelector("#activate-error>small");

    const successWrapperActivate = document.getElementById("activate-success");
    const successMessageActivate = document.querySelector("#activate-success>small")

    const progressIndicatorActivate = document.getElementById("progressIndicator-activate");
    if (activateForm) {
        activateForm.addEventListener("submit", function (event) {
            event.preventDefault();
            successWrapperActivate.style.display = "none";
            errorWrapperActivate.style.display = "none";
            progressIndicatorActivate.style.display = "block";


            const msisdnEl = document.getElementById("msisdn");
            const firstnameEl = document.getElementById("firstname");
            const lastnameEl = document.getElementById("lastname");
            const phonecontactEl = document.getElementById("phonecontact");
            const idtypeEl = document.getElementById("id-type");
            const idEl = document.getElementById("id");


            let postbody = {
                msisdn: msisdnEl.value,
                firstname: firstnameEl.value,
                lastname: lastnameEl.value,
                phonecontact: phonecontactEl.value,
                idtype: idtypeEl.value,
                id: idEl.value
            };


            $.post("/activate", postbody)
                .done(function (data) {
                    if (data) {
                        progressIndicatorActivate.style.display = "none";
                        if (data.success) {
                            console.log("success");


                            errorWrapperActivate.style.display = "none";
                            successMessageActivate.innerText = "Success";
                            successWrapperActivate.style.display = "block";


                        } else {
                            console.log("error");
                            errorMessageActivate.innerText = data.error;
                            successWrapperActivate.style.display = "none";
                            errorWrapperActivate.style.display = "block";


                        }


                    }


                }).fail(function (error) {
                console.log(error);
                progressIndicatorActivate.style.display = "none";
                errorMessageActivate.innerText = error.toString();
                successWrapperActivate.style.display = "none";
                errorWrapperActivate.style.display = "block";


            })


        })
    }


    /*................View History ....................*/


    const viewHistoryForm = document.getElementById("view-hist-form");

    const progressIndicatorHistory = document.getElementById("progressIndicator-History");

    const historyTableHeader = document.getElementById("history-tab-header");
    const historyTableBody = document.getElementById("history-tab-body");

    const historyTable = document.getElementById("history-table");

    const errorWrapperViewHist = document.getElementById("viewHist-error");
    const errorMessageViewHist = document.querySelector("#viewHist-error>small");

    if (viewHistoryForm) {
        viewHistoryForm.addEventListener("submit", function (event) {
            event.preventDefault();
            progressIndicatorHistory.style.display = "block";
            errorWrapperViewHist.style.display = "none";

            const msisdnEl = document.getElementById("sub-msisdn");
            const edrTypeEl = document.querySelector('input[name="history"]:checked');
            const beginDateEl = document.getElementById("startdate");
            const endDateEl = document.getElementById("enddate");

            let postbody = {
                msisdn: msisdnEl.value,
                begin_date: beginDateEl.value,
                end_date: endDateEl.value
            };

            let edrType = edrTypeEl.value;
            if (edrType === "usage") {
                $.post("/viewhist", postbody)
                    .done(function (data) {

                        if (data) {
                            progressIndicatorHistory.style.display = "none";
                            errorWrapperViewHist.style.display = "none";
                            if (data.success) {

                                let theadstring = "<th>Record Date</th><th>Cdr Type</th><th>Rating Group</th><th>Balance Type</th><th>Balance Before</th><th>Cost</th><th>Balance After</th><th>Start Time</th><th>End Time</th>"
                                let dataSet = data.success;
                                let tablebodyString = "";
                                dataSet.forEach(function (cdrItem) {
                                    tablebodyString += `<tr><td>${cdrItem.record_date}</td><td>Data Charging</td><td>${cdrItem.rating_group}</td><td>${cdrItem.balance_type}</td><td>${cdrItem.balance_before}</td><td>${cdrItem.cost}</td><td>${cdrItem.balance_after}</td><td>${cdrItem.start_time}</td><td>${cdrItem.end_time}</td></tr>`;
                                })

                                historyTableHeader.innerHTML = theadstring;
                                historyTableBody.innerHTML = tablebodyString;
                                historyTable.style.display = "table";




                            } else {
                                historyTable.style.display = "none";
                                errorMessageViewHist.innerText = data.error;
                                errorWrapperViewHist.style.display = "block";


                            }


                        }


                    }).fail(function (error) {
                    progressIndicatorHistory.style.display = "none";
                    historyTable.style.display = "none";
                    errorMessageViewHist.innerText = error.toString();
                    errorWrapperViewHist.style.display = "block";


                })

            } else if (edrType === "recharge") {
                $.post("/viewHistRecharge", postbody)
                    .done(function (data) {
                        if (data) {
                            progressIndicatorHistory.style.display = "none";
                            errorWrapperViewHist.style.display = "none";
                            if (data.success) {

                                let theadstring = "<th>Record Date</th><th>Cdr Type</th><th>Balance Type</th><th>Balance Before</th><th>Cost</th><th>Balance After</th><th>Channel</th><th>Transaction_Id</th>"
                                let dataSet = data.success;
                                let tablebodyString = "";
                                dataSet.forEach(function (cdrItem) {
                                    tablebodyString += `<tr><td>${cdrItem.record_date}</td><td>${cdrItem.edrType}</td><td>${cdrItem.balance_type}</td><td>${cdrItem.balance_before}</td><td>${cdrItem.cost}</td><td>${cdrItem.balance_after}</td><td>${cdrItem.channel}</td><td>${cdrItem.transaction_id}</td></tr>`;
                                })

                                historyTableHeader.innerHTML = theadstring;
                                historyTableBody.innerHTML = tablebodyString;
                                historyTable.style.display = "table";




                            } else {
                                historyTable.style.display = "none";
                                errorMessageViewHist.innerText = data.error;
                                errorWrapperViewHist.style.display = "block";


                            }


                        }


                    }).fail(function (error) {
                    progressIndicatorHistory.style.display = "none";
                    historyTable.style.display = "none";
                    errorMessageViewHist.innerText = error.toString();
                    errorWrapperViewHist.style.display = "block";



                })
            } else if (edrType === "eventdebit") {
                $.post("/viewHistEventCharge", postbody)
                    .done(function (data) {
                        if (data) {
                            progressIndicatorHistory.style.display = "none";
                            errorWrapperViewHist.style.display = "none";
                            if (data.success) {

                                let theadstring = "<th>Record Date</th><th>Cdr Type</th><th>Balance Type</th><th>Balance Before</th><th>Cost</th><th>Balance After</th>"
                                let dataSet = data.success;
                                let tablebodyString = "";
                                dataSet.forEach(function (cdrItem) {
                                    tablebodyString += `<tr><td>${cdrItem.record_date}</td><td>${cdrItem.edrType}</td><td>${cdrItem.balance_type}</td><td>${cdrItem.balance_before}</td><td>${cdrItem.cost}</td><td>${cdrItem.balance_after}</td></tr>`;
                                })

                                historyTableHeader.innerHTML = theadstring;
                                historyTableBody.innerHTML = tablebodyString;
                                historyTable.style.display = "table";




                            } else {
                                historyTable.style.display = "none";
                                errorMessageViewHist.innerText = data.error;
                                errorWrapperViewHist.style.display = "block";


                            }


                        }


                    }).fail(function (error) {
                    progressIndicatorHistory.style.display = "none";
                    historyTable.style.display = "none";
                    errorMessageViewHist.innerText = error.toString();
                    errorWrapperViewHist.style.display = "block";


                })
            } else {
                $.post("/viewHistAll", postbody)
                    .done(function (data) {
                        if (data) {
                            progressIndicatorHistory.style.display = "none";
                            errorWrapperViewHist.style.display = "none";
                            if (data.success) {

                                let theadstring = "<th>Record Date</th><th>Cdr Type</th><th>Balance Type</th><th>Balance Before</th><th>Cost</th><th>Balance After</th>"
                                let dataSet = data.success;
                                let tablebodyString = "";
                                dataSet.forEach(function (cdrItem) {
                                    tablebodyString += `<tr><td>${cdrItem.record_date}</td><td>${cdrItem.edrType}</td><td>${cdrItem.balance_type}</td><td>${cdrItem.balance_before}</td><td>${cdrItem.cost}</td><td>${cdrItem.balance_after}</td></tr>`;
                                })

                                historyTableHeader.innerHTML = theadstring;
                                historyTableBody.innerHTML = tablebodyString;
                                historyTable.style.display = "table";



                            } else {

                                historyTable.style.display = "none";
                                errorMessageViewHist.innerText = data.error;
                                errorWrapperViewHist.style.display = "block";



                            }


                        }


                    }).fail(function (error) {
                    progressIndicatorHistory.style.display = "none";
                    historyTable.style.display = "none";
                    errorMessageViewHist.innerText = error.toString();
                    errorWrapperViewHist.style.display = "block";



                })
            }


        })
    }


    /*   ...............Manage Account ...............*/
    const errorWrapperManageAcct = document.getElementById("manage-acct-error");
    const errorMessageManageAcct = document.querySelector("#manage-acct-error>small");

    const successWrapperManageAcct = document.getElementById("manage-acct-success");
    const successMessageManageAcct = document.querySelector("#manage-acct-success>small")

    const progressIndicatorManageAcct = document.getElementById("progressIndicator-manage-acct");

    const msisdnRecurrrent = document.getElementById("msisdn-recurrent");
    const tbody = document.getElementById("recurrent-tbody");
    const recurrentTableWrapper = document.getElementById("table-wrapper-recurrent");
    if (msisdnRecurrrent) {
        msisdnRecurrrent.addEventListener("input", function (event) {
            const msisdn = event.target.value;
            if (msisdn.length !== 12) {

            } else {
                progressIndicatorManageAcct.style.display = "block";
                errorWrapperManageAcct.style.display = "none";
                let url = "/getrecurrent";
                let querybody = {msisdn}
                $.get(url, querybody)
                    .done(function (data) {
                        progressIndicatorManageAcct.style.display = "none"
                        if (data.success) {
                            const result = data.success;
                            let rows = "";


                            if (result.length > 0) {

                                result.forEach(function (item) {
                                    rows += `<tr><td>${item.name}</td><td>${item.state}</td> <td><button type="Submit" data-bundlename="${item.name}" id="terminate-btn">Terminate</button></td>`


                                })

                                tbody.innerHTML = rows;

                            }
                            recurrentTableWrapper.style.display = "block";

                        } else {
                            recurrentTableWrapper.style.display = "none";
                            errorMessageManageAcct.innerText = data.error;
                            errorWrapperManageAcct.style.display = "block";
                        }

                    }).fail(function (error) {

                    progressIndicatorManageAcct.style.display = "none";
                    recurrentTableWrapper.style.display = "none";
                    errorMessageManageAcct.innerText = error.toString();
                    errorWrapperManageAcct.style.display = "block";

                })
            }


        })
    }


    function processChangeContactForm(event) {
        event.preventDefault();

        successWrapperManageAcct.style.display = "none";
        errorWrapperManageAcct.style.display = "none";
        progressIndicatorManageAcct.style.display = "block";

        const msisdn = document.getElementById("msisdn").value;
        const contact = document.getElementById("phone-contact").value;
        const contacttype = document.getElementById("contact-type").value;


        const postbody = {msisdn, contact,contacttype};


        $.post("/changecontact", postbody)
            .done(function (data) {
                if (data) {
                    progressIndicatorManageAcct.style.display = "none";
                    if (data.success) {

                        errorWrapperManageAcct.style.display = "none";
                        successMessageManageAcct.innerText = "Success";
                        successWrapperManageAcct.style.display = "block";


                    } else {
                        errorMessageManageAcct.innerText = data.error;
                        successWrapperManageAcct.style.display = "none";
                        errorWrapperManageAcct.style.display = "block";


                    }


                }


            }).fail(function (error) {
            console.log(error);
            progressIndicatorManageAcct.style.display = "none";
            errorMessageManageAcct.innerText = error.toString();
            successWrapperManageAcct.style.display = "none";
            errorWrapperManageAcct.style.display = "block";


        })


    }

    function processChangeProductForm(event) {
        event.preventDefault();

        successWrapperManageAcct.style.display = "none";
        errorWrapperManageAcct.style.display = "none";
        progressIndicatorManageAcct.style.display = "block";

        const msisdn = document.getElementById("msisdn").value;
        const product = document.getElementById("products").value;

        const postbody = {msisdn, product};


        $.post("/changeproduct", postbody)
            .done(function (data) {
                if (data) {
                    progressIndicatorManageAcct.style.display = "none";
                    if (data.success) {

                        errorWrapperManageAcct.style.display = "none";
                        successMessageManageAcct.innerText = "Success";
                        successWrapperManageAcct.style.display = "block";


                    } else {
                        errorMessageManageAcct.innerText = data.error;
                        successWrapperManageAcct.style.display = "none";
                        errorWrapperManageAcct.style.display = "block";


                    }


                }


            }).fail(function (error) {
            console.log(error);
            progressIndicatorManageAcct.style.display = "none";
            errorMessageManageAcct.innerText = error.toString();
            successWrapperManageAcct.style.display = "none";
            errorWrapperManageAcct.style.display = "block";


        })


    }

    function processChangeStateForm(event) {
        event.preventDefault();

        successWrapperManageAcct.style.display = "none";
        errorWrapperManageAcct.style.display = "none";
        progressIndicatorManageAcct.style.display = "block";

        const msisdn = document.getElementById("msisdn").value;
        const state = document.getElementById("acct-states").value;

        const postbody = {msisdn, state};


        $.post("/changeacctstate", postbody)
            .done(function (data) {
                if (data) {
                    progressIndicatorManageAcct.style.display = "none";
                    if (data.success) {

                        errorWrapperManageAcct.style.display = "none";
                        successMessageManageAcct.innerText = "Success";
                        successWrapperManageAcct.style.display = "block";


                    } else {
                        errorMessageManageAcct.innerText = data.error;
                        successWrapperManageAcct.style.display = "none";
                        errorWrapperManageAcct.style.display = "block";


                    }


                }


            }).fail(function (error) {
            console.log(error);
            progressIndicatorManageAcct.style.display = "none";
            errorMessageManageAcct.innerText = error.toString();
            successWrapperManageAcct.style.display = "none";
            errorWrapperManageAcct.style.display = "block";


        })


    }

    function processExpireDataForm(event) {
        event.preventDefault();

        successWrapperManageAcct.style.display = "none";
        errorWrapperManageAcct.style.display = "none";
        progressIndicatorManageAcct.style.display = "block";

        const msisdn = document.getElementById("msisdn").value;
        const balancetype = document.getElementById("balanceTypes").value;

        const postbody = {msisdn, balancetype};


        $.post("/expiredata", postbody)
            .done(function (data) {
                if (data) {
                    progressIndicatorManageAcct.style.display = "none";
                    if (data.success) {

                        errorWrapperManageAcct.style.display = "none";
                        successMessageManageAcct.innerText = "Success";
                        successWrapperManageAcct.style.display = "block";


                    } else {
                        errorMessageManageAcct.innerText = data.error;
                        successWrapperManageAcct.style.display = "none";
                        errorWrapperManageAcct.style.display = "block";


                    }


                }


            }).fail(function (error) {
            console.log(error);
            progressIndicatorManageAcct.style.display = "none";
            errorMessageManageAcct.innerText = error.toString();
            successWrapperManageAcct.style.display = "none";
            errorWrapperManageAcct.style.display = "block";


        })


    }

    function processAdjustExpiryDateForm(event) {
        event.preventDefault();

        successWrapperManageAcct.style.display = "none";
        errorWrapperManageAcct.style.display = "none";
        progressIndicatorManageAcct.style.display = "block";

        const msisdn = document.getElementById("msisdn").value;
        const balancetype = document.getElementById("balanceTypes").value;
        const expirydate = document.getElementById("expiry-date").value;

        const postbody = {msisdn, balancetype, expirydate};


        $.post("/adjustexpiry", postbody)
            .done(function (data) {
                if (data) {
                    progressIndicatorManageAcct.style.display = "none";
                    if (data.success) {

                        errorWrapperManageAcct.style.display = "none";
                        successMessageManageAcct.innerText = "Success";
                        successWrapperManageAcct.style.display = "block";


                    } else {
                        errorMessageManageAcct.innerText = data.error;
                        successWrapperManageAcct.style.display = "none";
                        errorWrapperManageAcct.style.display = "block";


                    }


                }


            }).fail(function (error) {
            console.log(error);
            progressIndicatorManageAcct.style.display = "none";
            errorMessageManageAcct.innerText = error.toString();
            successWrapperManageAcct.style.display = "none";
            errorWrapperManageAcct.style.display = "block";


        })


    }

    function processReccurrentForm(event) {
        event.preventDefault();

        successWrapperManageAcct.style.display = "none";
        errorWrapperManageAcct.style.display = "none";
        progressIndicatorManageAcct.style.display = "block";

        const msisdn = document.getElementById("msisdn-recurrent").value;
        const recurrentplan = document.getElementById("terminate-btn").dataset.bundlename;

        if (msisdn && recurrentplan) {
            const postbody = {msisdn, recurrentplan};
            $.post("/managerecurrent", postbody)
                .done(function (data) {
                    if (data) {
                        progressIndicatorManageAcct.style.display = "none";
                        if (data.success) {

                            errorWrapperManageAcct.style.display = "none";
                            successMessageManageAcct.innerText = "Success";
                            successWrapperManageAcct.style.display = "block";


                        } else {
                            errorMessageManageAcct.innerText = data.error;
                            successWrapperManageAcct.style.display = "none";
                            errorWrapperManageAcct.style.display = "block";


                        }


                    }


                }).fail(function (error) {
                console.log(error);
                progressIndicatorManageAcct.style.display = "none";
                errorMessageManageAcct.innerText = error.toString();
                successWrapperManageAcct.style.display = "none";
                errorWrapperManageAcct.style.display = "block";


            })

        }


    }

    function processTransferCashForm(event) {
        event.preventDefault();

        successWrapperManageAcct.style.display = "none";
        errorWrapperManageAcct.style.display = "none";
        progressIndicatorManageAcct.style.display = "block";

        const from_msisdn = document.getElementById("from-msisdn-cash").value;
        const to_msisdn = document.getElementById("to-msisdn-cash").value;
        const amount = document.getElementById("amount-cash").value;

        const postbody = {from_msisdn,to_msisdn,amount};


        $.post("/cashtransfer", postbody)
            .done(function (data) {
                if (data) {
                    progressIndicatorManageAcct.style.display = "none";
                    if (data.success) {

                        errorWrapperManageAcct.style.display = "none";
                        successMessageManageAcct.innerText = "Success";
                        successWrapperManageAcct.style.display = "block";


                    } else {
                        errorMessageManageAcct.innerText = data.error;
                        successWrapperManageAcct.style.display = "none";
                        errorWrapperManageAcct.style.display = "block";


                    }


                }


            }).fail(function (error) {
            console.log(error);
            progressIndicatorManageAcct.style.display = "none";
            errorMessageManageAcct.innerText = error.toString();
            successWrapperManageAcct.style.display = "none";
            errorWrapperManageAcct.style.display = "block";


        })


    }


    const transferCashForm = document.getElementById("transfer-cash-form");
    if (transferCashForm){
        transferCashForm.addEventListener("submit", processTransferCashForm);
    }


    const changeContactForm = document.getElementById("change-contact-form");
    if (changeContactForm) {
        changeContactForm.addEventListener("submit", processChangeContactForm)
    }
    const changeProductForm = document.getElementById("change-product-form");
    if (changeProductForm) {
        changeProductForm.addEventListener("submit", processChangeProductForm)
    }

    const changeStateForm = document.getElementById("change-acct-state-Form");
    if (changeStateForm) {
        changeStateForm.addEventListener("submit", processChangeStateForm)
    }

    const expireDataForm = document.getElementById("expire-data-form");
    if (expireDataForm) {
        expireDataForm.addEventListener("submit", processExpireDataForm)
    }

    const adjustExpiryDateForm = document.getElementById("adjust-expiryDate-form");
    if (adjustExpiryDateForm) {
        adjustExpiryDateForm.addEventListener("submit", processAdjustExpiryDateForm)
    }

    const terminateRecurrentForm = document.getElementById("terminate-recurrent-form");
    if (terminateRecurrentForm) {
        terminateRecurrentForm.addEventListener("submit", processReccurrentForm)
    }


    /*......Create User ........*/

    const errorWrapperCreateAcct = document.getElementById("create-acct-error");
    const errorMessageCreateAcct = document.querySelector("#create-acct-error>small");

    const successWrapperCreateAcct = document.getElementById("create-acct-success");
    const successMessageCreateAcct = document.querySelector("#create-acct-success>small")

    const progressIndicatorCreateAcct = document.getElementById("progressIndicator-create-acct");

    const exitbtn = document.getElementById("exit-btn");
    if (exitbtn) {
        exitbtn.addEventListener("click", function (event) {
            window.location.href = "/";

        })
    }

    function processCreateUserForm(event) {
        event.preventDefault();

        successWrapperCreateAcct.style.display = "none";
        errorWrapperCreateAcct.style.display = "none";
        progressIndicatorCreateAcct.style.display = "block";

        const username = document.getElementById("username").value;
        const email = document.getElementById("email").value;
        const firstname = document.getElementById("firstname").value;
        const lastname = document.getElementById("lastname").value;
        const password = document.getElementById("password").value;
        const password2 = document.getElementById("password2").value;
        const role = document.getElementById("role").value;


        if (username && email && firstname && lastname && password && password2 && role) {

            if (password !== password2) {
                progressIndicatorCreateAcct.style.display = "none";
                errorMessageCreateAcct.innerText = "Passwords do not match";
                successWrapperCreateAcct.style.display = "none";
                errorWrapperCreateAcct.style.display = "block";
                return;

            }


            const postbody = {username, email, firstname, lastname, password, password2, role};
            $.post("/user", postbody)
                .done(function (data) {
                    if (data) {
                        progressIndicatorCreateAcct.style.display = "none";
                        if (data.success) {

                            errorWrapperCreateAcct.style.display = "none";
                            successMessageCreateAcct.innerText = "Account created";
                            successWrapperCreateAcct.style.display = "block";


                        } else {
                            errorMessageCreateAcct.innerText = data.error;
                            successWrapperCreateAcct.style.display = "none";
                            errorWrapperCreateAcct.style.display = "block";


                        }


                    }


                }).fail(function (error) {
                console.log(error);
                progressIndicatorCreateAcct.style.display = "none";
                errorMessageCreateAcct.innerText = error.toString();
                successWrapperCreateAcct.style.display = "none";
                errorWrapperCreateAcct.style.display = "block";


            })

        }


    }

    const createUserForm = document.getElementById("create-user-form");

    if (createUserForm) {
        createUserForm.addEventListener("submit", processCreateUserForm)
    }


    /*.... Forgot Password.....*/
    const forgotExitBtn = document.getElementById("cancel-forget-pass-btn");
    if (forgotExitBtn) {
        forgotExitBtn.addEventListener("click", function (event) {
            window.location.href = "/login";

        })
    }

    const forgetPasswdForm = document.getElementById("forgetpasswd-form");
    const progressForgetPasswd = document.getElementById("progressIndicator-forgetpasswd");
    const messageForgetPass = document.getElementById("message-forgetPass");

    function processForgetPasswdForm(event) {
        event.preventDefault();
        messageForgetPass.innerHTML = "";
        progressForgetPasswd.style.display = "block";
        const email = document.getElementById("email-forget-passwd").value;
        if (email) {
            const postbody = {email};
            $.post("/forgetpass", postbody)
                .done(function (data) {
                    if (data) {
                        progressForgetPasswd.style.display = "none";
                        if (data.success) {
                            messageForgetPass.innerHTML = '<i class="fas fa-check-circle"></i>&nbsp;Password reset link sent to your inbox';
                            messageForgetPass.style.color = "#fff";


                        } else {
                            messageForgetPass.innerHTML = '<i class="fas fa-exclamation-triangle"></i>&nbsp;' + data.error.toString();
                            messageForgetPass.style.color = "#ec0b72";

                        }


                    }


                }).fail(function (error) {
                console.log(error);
                progressForgetPasswd.style.display = "none";
                messageForgetPass.innerHTML = '<i class="fas fa-exclamation-triangle"></i>&nbsp;' + error.toString();
                messageForgetPass.style.color = "#ec0b72";

            })

        }


    }

    if (forgetPasswdForm) {
        forgetPasswdForm.addEventListener("submit", processForgetPasswdForm);

    }

    /*.....Reset Password ......*/
    const resetPasswordForm = document.getElementById("reset-Password-Form");
    const errorMessageRestPass = document.getElementById("error-message-reset-passwd");
    const successMessageBox = document.getElementById("reset-pass-group-1");
    const formBlock = document.getElementById("reset-pass-group-2");

    function processResetPasswdForm(event) {
        event.preventDefault();
        errorMessageRestPass.innerHTML = "";
        progressForgetPasswd.style.display = "block";

        const password = document.getElementById("password").value;
        const password2 = document.getElementById("password2").value;
        const uuid = document.getElementById("reset-submit-pass-btn").dataset.id;


        if (password && password2) {
            if (password !== password2) {
                progressForgetPasswd.style.display = "none";
                errorMessageRestPass.innerHTML = '<i class="fas fa-exclamation-triangle"></i>&nbsp;' + 'Passwords do not match';
                return;
            }

            const postbody = {password, password2, uuid};
            $.post("/reset", postbody)
                .done(function (data) {
                    if (data) {
                        progressForgetPasswd.style.display = "none";
                        if (data.success) {
                            formBlock.style.display = "none";
                            successMessageBox.style.display = "block";


                        } else {
                            errorMessageRestPass.innerHTML = '<i class="fas fa-exclamation-triangle"></i>&nbsp;' + data.error.toString();

                        }


                    }


                }).fail(function (error) {
                console.log(error);
                errorMessageRestPass.innerHTML = '<i class="fas fa-exclamation-triangle"></i>&nbsp;' + error.toString();

            })

        }


    }

    if (resetPasswordForm) {
        resetPasswordForm.addEventListener("submit", processResetPasswdForm);
    }


    /*......Change Password....*/

    const togglePassList = document.querySelectorAll(".togglePassword");
    const changePasswdForm = document.getElementById("change-pass-form");
    const changePassExitBtn = document.getElementById("cancel-forget-pass-btn2");
    if (changePassExitBtn) {
        changePassExitBtn.addEventListener("click", function (event) {
            window.location.href = "/";

        })
    }

    if (togglePassList) {
        togglePassList.forEach(function (togglePass) {
            togglePass.addEventListener("click", function (event) {
                // toggle the type attribute
                const oldpassword = togglePass.nextElementSibling;

                const type = oldpassword.getAttribute('type') === 'password' ? 'text' : 'password';
                oldpassword.setAttribute('type', type);
                // toggle the eye slash icon
                this.classList.toggle('fa-eye-slash');

            })

        })
    }

    function processChangePasswdForm(event) {
        event.preventDefault();
        errorMessageRestPass.innerHTML = "";
        progressForgetPasswd.style.display = "block";

        const password = document.getElementById("password").value;
        const password2 = document.getElementById("password2").value;
        const oldpassword = document.getElementById("oldpass").value;


        if (password && password2 && oldpassword) {
            if (password !== password2) {
                progressForgetPasswd.style.display = "none";
                errorMessageRestPass.innerHTML = '<i class="fas fa-exclamation-triangle"></i>&nbsp;' + 'Passwords do not match';
                return;
            }

            const postbody = {password, password2, oldpassword};
            $.post("/changepass", postbody)
                .done(function (data) {
                    if (data) {
                        progressForgetPasswd.style.display = "none";
                        if (data.success) {
                            formBlock.style.display = "none";
                            successMessageBox.style.display = "block";


                        } else {
                            errorMessageRestPass.innerHTML = '<i class="fas fa-exclamation-triangle"></i>&nbsp;' + data.error.toString();

                        }


                    }


                }).fail(function (error) {
                console.log(error);
                errorMessageRestPass.innerHTML = '<i class="fas fa-exclamation-triangle"></i>&nbsp;' + error.toString();

            })

        }


    }

    if (changePasswdForm) {
        changePasswdForm.addEventListener("submit", processChangePasswdForm)
    }


    /*......Setting date.....*/
    let testdate = document.getElementById("startdate");
    if (testdate) {

        let date = new Date();
        let yesterday = date - 1000 * 60 * 60 * 24 * 2;   // current date's milliseconds - 1,000 ms * 60 s * 60 mins * 24 hrs * (# of days beyond one to go back)
        yesterday = new Date(yesterday);


        $(testdate).datetimepicker({
            value: yesterday,
            format: 'd-m-Y H:i:s',
            step: 1
        });
    }


    let histBeginDate = document.getElementById("startdate");
    let histEndDate = document.getElementById("enddate");
    $.datetimepicker.setLocale('en-GB');
    if (histBeginDate && histEndDate) {
        let today = new Date();
        let yesterday = today - 1000 * 60 * 60 * 24 * 2;
        yesterday = new Date(yesterday);

        $(histBeginDate).datetimepicker({
            value: yesterday,
            format: 'd-m-Y H:i:s',
            step: 1,
            yearStart: 1900,
            yearEnd: 2100
        });

        $(histEndDate).datetimepicker({
            value: today,
            format: 'd-m-Y H:i:s',
            step: 1,
            yearStart: 1900,
            yearEnd: 2100,
        });


    }

    let adjustExpiryDateSet = document.getElementById("expiry-date");
    if (adjustExpiryDateSet){
        let today = new Date();
        $(adjustExpiryDateSet).datetimepicker({
            value: today,
            format: 'd-m-Y H:i:s',
            step: 1,
            yearStart: 1900,
            yearEnd: 2100,
        });

    }


})


