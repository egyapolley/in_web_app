const express = require("express"),
    controller = require("../controllers/controller"),
    passport =require("passport"),
    middleware = require("../middlewares/middlewares"),
    router = express.Router();


router.get("/",middleware.checkAuthenticated,controller.renderdashboard);
router.get("/manageaccount",middleware.checkAuthenticated,middleware.checkForLevel_Two_Three, controller.rendermanageAccount)
router.get("/topup",middleware.checkAuthenticated,middleware.checkForLevel_Two_Three, controller.rendertopup);

router.get("/bundles",middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.getbundles)

router.get("/balance",middleware.checkAuthenticated,controller.getbalances );
router.post("/bundle", middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.postbundle);

router.get("/loadcard",middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.renderloadcard);
router.post("/loadcard",middleware.checkAuthenticated,middleware.checkForLevel_Two_Three, controller.postloadcard);
router.get("/checkVoucher", middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.rendercheckVoucher);
router.post("/manageVoucher", middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.postmanagevoucher);

router.get("/viewhist", middleware.checkAuthenticated,controller.renderviewhistory);
router.post("/viewhist",middleware.checkAuthenticated, controller.postViewHistory);
router.post("/viewHistRecharge",middleware.checkAuthenticated, controller.postViewHistRecharge)
router.post("/viewHistEventCharge", middleware.checkAuthenticated,controller.postviewHistEventCharge);
router.post("/viewHistAll", middleware.checkAuthenticated,controller.postviewHistAll);

router.get("/overscratch", middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.renderoverscratch);
router.post("/overscratchtop",middleware.checkAuthenticated,middleware.checkForLevel_Two_Three, controller.postoverscratchtop);


router.get("/activate", middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.renderactivate);
router.post("/activate", middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.postActivate);

router.get("/transfer", middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.rendertransfer);
router.post("/transfer", middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.posttransfer);


router.get("/expiredata",middleware.checkAuthenticated, middleware.checkForLevel_Two_Three,controller.renderexpiredata);
router.get("/changeacctstate",middleware.checkAuthenticated,middleware.checkForLevel_Two_Three, controller.renderaccountstate);
router.get("/changephonecontact",middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.renderchangephonecontact);
router.get("/changeproduct",middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.renderchangeproduct);
router.get("/adjustexpiry",middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.renderadjustexpirydate);
router.get("/managerecurrent",middleware.checkAuthenticated,middleware.checkForLevel_Two_Three, controller.rendermanagerecurrent);
router.get("/getrecurrent",middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.getmanagerecurrent);
router.get("/cashtransfer",middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.rendercashtransfer);

router.post("/expiredata", middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.postexpiredata);
router.post("/changeacctstate",middleware.checkAuthenticated, middleware.checkForLevel_Two_Three,controller.postchangestate);
router.post("/changecontact",middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.postchangecontact);
router.post("/changeproduct",middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.postchangeproduct);
router.post("/adjustexpiry",middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.postadjustexpiry);
router.post("/managerecurrent",middleware.checkAuthenticated,middleware.checkForLevel_Two_Three, controller.postterminaterecurrent);
router.post("/cashtransfer",middleware.checkAuthenticated,middleware.checkForLevel_Two_Three,controller.postcashtransfer);


router.get("/login", controller.renderlogin);
router.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}));
router.get("/fpass",controller.renderforgetPasswd);
router.post("/forgetpass",controller.postForgetPasswd);
router.get("/reset/:uuid",controller.renderResetpasswd);
router.post("/reset",controller.postResetpasswd);


router.get("/logout", middleware.checkAuthenticated,controller.getlogout);
router.get("/changepass",middleware.checkAuthenticated,controller.renderChangePass )
router.post("/changepass",middleware.checkAuthenticated,controller.postChangePass )

router.get("/user",middleware.checkAuthenticated,middleware.checkForLevel_Three,controller.rendercreateuser)

router.post("/user", middleware.checkAuthenticated,middleware.checkForLevel_Three,controller.postcreateuser);








module.exports = router;
