const moment = require("moment");

module.exports = {

    formatVoucherStatus: (status, redeemed_date) => {
        switch (status) {
            case "1":
                if (redeemed_date && redeemed_date !== "n/a") {
                    return "USED"
                }
                break;

            case "D":
                return "DELETED";
            case "F":
                return "FROZEN";
            case "S":
                return "SUSPENDED";

            case "C":
                return "CREATED";

            default:
                return "ACTIVE";
        }

    },

    formateDate: (date) => {
        return moment(date, "YYYYMMDDHHmmss").format("DD-MM-YYYY HH:mm:ss")

    },

    getBundleName: (bundleId) => {
        if (bundleId === "21" || bundleId === "General Cash") return "General Cash";
        else if (bundleId === "29" || bundleId === "Data") return "Data";
        else if (bundleId === "30" || bundleId === "Promotional Data") return "Promomotional Data";
        else if (bundleId === "61" || bundleId === "Gift Data") return "Gift Data";
        else if (bundleId === "107" || bundleId === "FDFL Data") return "FDFL Data";
        else if (bundleId === "108" || bundleId === "Tablet Data") return "Tablet Data";
        else if (bundleId === "163" || bundleId === "ULNitePlan Status") return "Unlimited Night Status";
        else if (bundleId === "182" || bundleId === "Staff Data") return "Staff Data";
        else if (bundleId === "222" || bundleId === "Bonus Data") return "Bonus Data";
        else if (bundleId === "303" || bundleId === "ULDayNitePlan Data") return "Unlimited Day/Night Data";
        else if (bundleId === "304" || bundleId === "ULDayNitePlan Status") return "Unlimited Day/Night Status";
        else if (bundleId === "342" || bundleId === "Videobundle Data") return "Video Package Data";
        else if (bundleId === "462" || bundleId === "ULBusiness2 Data") return "Unlimited Business Data";
        else if (bundleId === "463" || bundleId === "ULBusiness2 Status") return "Unlimited Business Status";
        else if (bundleId === "662" || bundleId === "Complimentary Data") return "Complementary Data";
        else if (bundleId === "682" || bundleId === "ULVideo Data") return "Unlimited Video";
        else if (bundleId === "683" || bundleId === "ULVideo Status") return "Unlimited Video Status";
        else if (bundleId === "742" || bundleId === "Ten4Ten Data") return "Ten4Ten Data";
        else if (bundleId === "802" || bundleId === "FreeTime Data") return "FreeTime Bonus Data";
        else if (bundleId === "862" || bundleId === "1GBSurfplus Data") return "1GB Surfplus Data";
        else if (bundleId === "863" || bundleId === "1.6GBSurfplus Data") return "1.6GB Surfplus Data";
        else if (bundleId === "864" || bundleId === "7GBSurfplus Data") return "7GB Surfplus Data";
        else if (bundleId === "865" || bundleId === "2GBSurfplus Data") return "2GB Surfplus Data";
        else if (bundleId === "866" || bundleId === "3.2GBSurfplus Data") return "3.2GB Surfplus Data";
        else if (bundleId === "867" || bundleId === "5GBSurfplus Data") return "5GB Surfplus Data";
        else if (bundleId === "868" || bundleId === "12GBSurfplus Data") return "12GB Surfplus Data";
        else if (bundleId === "869" || bundleId === "30GBSurfplus Data") return "30GB Surfplus Data";
        else if (bundleId === "870" || bundleId === "45GBSurfplus Data") return "45GB Surfplus Data";
        else if (bundleId === "871" || bundleId === "65GBSurfplus Data") return "65GB Surfplus Data";
        else if (bundleId === "872" || bundleId === "125GBSurfplus Data") return "125GB Surfplus Data";
        else if (bundleId === "873" || bundleId === "185GBSurfplus Data") return "185GB Surfplus Data";
        else if (bundleId === "876" || bundleId === "Free Saturday Data") return "Free Saturday Data";
        else if (bundleId === "942" || bundleId === "Taxify Data") return "Taxify Data";
        else if (bundleId === "983" || bundleId === "ExtraTime Bonus Bonus") return "ExtraTime Bonus Data";
        else if (bundleId === "1002" || bundleId === "Anniversary Data") return "Anniversary Data";
        else if (bundleId === "1004" || bundleId === "UL_AlwaysON_Standard Status") return "AlwaysON_Standard Status";
        else if (bundleId === "1005" || bundleId === "UL_AlwaysON_Standard Data") return "AlwaysON_Standard Data";
        else if (bundleId === "1006" || bundleId === "UL_AlwaysON_Super Status") return "AlwaysON_Super Status";
        else if (bundleId === "1007" || bundleId === "UL_AlwaysON_Super Data") return "AlwaysON_Super Data";
        else if (bundleId === "1008" || bundleId === "UL_AlwaysON_Ultra Status") return "AlwaysON_Ultra Status";
        else if (bundleId === "1009" || bundleId === "UL_AlwaysON_Ultra Data") return "AlwaysON_Ultra Data";
        else if (bundleId === "1042" || bundleId === "UL_AlwaysON_Starter Data") return "AlwaysON_Starter Data";
        else if (bundleId === "1043" || bundleId === "UL_AlwaysON_Starter Status") return "AlwaysON_Starter Status";
        else if (bundleId === "1044" || bundleId === "UL_AlwaysON_Lite Data") return "AlwaysON_Lite Data";
        else if (bundleId === "1045" || bundleId === "UL_AlwaysON_Lite Status") return "AlwaysON_Lite Status";
        else if (bundleId === "1046" || bundleId === "UL_AlwaysON_Streamer Data") return "AlwaysON_Streamer Data";
        else if (bundleId === "1047" || bundleId === "UL_AlwaysON_Streamer Status") return "AlwaysON_Streamer Status";
        else if (bundleId === "1184" || bundleId === "UL_AlwaysON_Maxi Data") return "AlwaysON_Maxi Data";
        else if (bundleId === "1185" || bundleId === "UL_AlwaysON_Maxi Status") return "AlwaysON_Maxi Status";
        else if (bundleId === "1082" || bundleId === "Staff_AlwaysON_1GB Data") return "Staff_AlwaysON_1GB Data";
        else if (bundleId === "1083" || bundleId === "Staff_AlwaysON_1GB Count") return "Staff_AlwaysON_1GB Count";
        else if (bundleId === "1084" || bundleId === "Staff_AlwaysON_2GB Data") return "Staff_AlwaysON_2GB Data";
        else if (bundleId === "1085" || bundleId === "Staff_AlwaysON_2GB Count") return "Staff_AlwaysON_2GB Count";
        else if (bundleId === "1086" || bundleId === "Staff_AlwaysON_5GB Data") return "Staff_AlwaysON_5GB Data";
        else if (bundleId === "1087" || bundleId === "Staff_AlwaysON_5GB Count") return "Staff_AlwaysON_5GB Count";
        else if (bundleId === "1088" || bundleId === "Staff_AlwaysON_10GB Data") return "Staff_AlwaysON_10GB Data";
        else if (bundleId === "1089" || bundleId === "Staff_AlwaysON_10GB Count") return "Staff_AlwaysON_10GB Count";
        else if (bundleId === "1090" || bundleId === "Staff_AlwaysON_3GB Count") return "Staff_AlwaysON_3GB Count";
        else if (bundleId === "1091" || bundleId === "Staff_AlwaysON_3GB Data") return "Staff_AlwaysON_3GB Data";
        else if (bundleId === "101" || bundleId === "Autorecovery") return "Autorecovery";
        else if (bundleId === "1102" || bundleId === "Bundle ExpiryTrack Status") return "Bundle Expiry Tracker";
        else if (bundleId === "32" || bundleId === "CTAllowLastDate") return "CTAllowLastDate";
        else if (bundleId === "1242" || bundleId === "Pay Weekly Data") return "Pay Weekly Data";
        else if (bundleId === "1270" || bundleId === "BingeXtra Data") return "BingeXtra Data";
        else if (bundleId === "1271" || bundleId === "Zoom Data") return "Zoom Data";
        else if (bundleId === "1272" || bundleId === "WorkStreak Data") return "WorkStreak Data";
        else if (bundleId === "1273" || bundleId === "AfterHours Status") return "AfterHours Status";
        else if (bundleId === "1274" || bundleId === "AfterHoursTemp Status") return "AfterHoursTemp Status";


    },

    getAcctState: (state) => {
        switch (state) {
            case "A":
                return "ACTIVE";
            case "D":
                return "DORMANT";
            case "F":
                return "FROZEN";
            case "S":
                return "SUSPENDED";
            case "T":
                return "TERMINATED";
            case "P":
                return "PRE-USE";

        }
    },

    getEdrType: (edrType) => {

        switch (edrType) {

            case 4:
                return "Recharge";
            case 47:
                return "Voucher Type Recharge";
            case 49:
                return "Recurrent Bundle Recharge";
            case 8:
                return "Custom Recharge"
            case 1:
                return "Data Charging";
            case 2:
                return "Operator Update";
            case 3:
                return "Expiration";
            case 5:
                return "Event Charge";
            case 15:
                return "Voucher Redeem";
            case 16:
                return "Rewards";
            case 31:
                return "Product Type Swap";
            case 52:
                return "Recurrent Bundle State Change";
            case 55:
                return "Wallet Life Cycle ";

        }

    },

    getUserRole: (user)=>{
        let role ={};
        if(user.role === "l3") role.l3=true;
        else if (user.role ==="l2") role.l2 =true;
        else role.l1=true;
        return role;
    }


}
