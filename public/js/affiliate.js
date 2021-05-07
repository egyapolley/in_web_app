$(function () {


    const assignCodeSuccessWrapper = document.getElementById("mgm-success-assignCode");
    const assignCodeSuccessMessage = document.querySelector("#mgm-success-assignCode >small");
    const assignCodeErrorWrapper = document.getElementById("mgm-error-assignCode");
    const assignCodeErrorMessage = document.querySelector("#mgm-error-assignCode >small");
    const progressIndicatorAssignCode = document.getElementById("progressIndicator-assignCode");

    function assignCodeFxn(event) {
        event.preventDefault();

        assignCodeSuccessWrapper.style.display = "none";
        assignCodeErrorWrapper.style.display = "none";
        progressIndicatorAssignCode.style.display = "block";

        const firstName = document.getElementById("inf-firstname").value;
        const lastName = document.getElementById("inf-lastname").value;
        const code = document.getElementById("inf-code").value;
        const subscriberNumber = document.getElementById("inf-msisdn").value;



        const postbody = {firstName,lastName,subscriberNumber,code}

        $.post("/assign_aff", postbody)
            .done(function (data) {
                if (data) {
                    progressIndicatorAssignCode.style.display = "none";
                    if (data.success) {
                        assignCodeErrorWrapper.style.display = "none";
                        assignCodeSuccessMessage.innerHTML = data.message
                        assignCodeSuccessWrapper.style.display = "block";

                    } else{
                        assignCodeErrorMessage.innerHTML = data.message;
                        assignCodeSuccessWrapper.style.display = "none";
                        assignCodeErrorWrapper.style.display = "block";
                    }
                }
            }).fail(function (error) {
            console.log(error)
            progressIndicatorAssignCode.style.display = "none";
            assignCodeErrorMessage.innerHTML += "Network Failure.Please check internet connection";
            assignCodeSuccessWrapper.style.display = "none";
            assignCodeErrorWrapper.style.display = "block";


        })


    }

    const assignCodeForm = document.getElementById("assign-code-form");
    if (assignCodeForm) {
        assignCodeForm.addEventListener("submit", assignCodeFxn)
    }



    const showInfsSuccessWrapper = document.getElementById("mgm-success-show-infs");
    const showInfsErrorWrapper = document.getElementById("mgm-error-show-infs");
    const showInfsErrorMessage = document.querySelector("#mgm-error-show-infs >small");
    const progressIndicatorShowInfs = document.getElementById("progressIndicator-show-infs");

    const showIfsBtn = document.getElementById("show-ifs-btn")

    function showInfs(event) {
        event.preventDefault();

        showInfsSuccessWrapper.style.display = "none";
        showInfsErrorWrapper.style.display = "none";
        progressIndicatorShowInfs.style.display = "block";


        const tableBody = document.getElementById("show-infs-table-tbody");


        $.get("/all_aff")
            .done(function (data) {
                if (data) {
                    progressIndicatorShowInfs.style.display = "none";
                    if (data.success) {

                        showInfsErrorWrapper.style.display = "none";
                        const dataSet = data.dataSet;

                        let tableRows ='<tr><td></td><td>FirstName</td><td>LastName</td><td>Code</td><td>Code Status</td><td>Number Of Referreds</td><td>Creation Date</td><td>Surfline Number</td></tr>'
                        if (dataSet.length >0){
                            dataSet.forEach(function (item,index) {
                                tableRows+=`<tr><td>${index+1}</td><td>${item.firstName}</td><td>${item.lastName}</td><td>${item.code}</td><td>${item.code_status}</td><td>${item.NumbOfActivatedRefs}</td><td>${item.createdAt}</td><td>${item.surflineNumber}</td></tr>`
                            })
                        }

                        tableBody.innerHTML=tableRows;
                        showIfsBtn.innerHTML=`<i class="fas fa-redo"></i>&nbsp;&nbsp;<span>Refresh</span>`
                    } else {
                        showInfsErrorMessage.innerHTML = data.message;
                        showInfsSuccessWrapper.style.display = "none";
                        showInfsErrorWrapper.style.display = "block";
                        tableBody.innerHTML="";
                        showIfsBtn.innerHTML="Click To Fetch Data"


                    }


                }


            }).fail(function (error) {
            console.log(error)
            progressIndicatorShowInfs.style.display = "none";
            showInfsErrorMessage.innerHTML += "Network Failure.Please check internet connection";
            showInfsSuccessWrapper.style.display = "none";
            showInfsErrorWrapper.style.display = "block";
            tableBody.innerHTML="";
            showIfsBtn.innerHTML="Click To Fetch Data"


        })


    }

    const showInfsForm = document.getElementById("show-infs-form");
    if (showInfsForm) {
        showInfsForm.addEventListener("submit", showInfs)
    }




})
