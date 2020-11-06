

module.exports = {

    checkAuthenticated: (req, res, next) =>{
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.logout();
        if (req.session){
            req.session.destroy(function (error) {
                if (error) {
                    console.log(error)
                }
                return res.render("login");

            })
        }else {
            res.render("login");
        }


    }
},

    checkForLevel_Two_Three: (req, res, next) =>{
        if (req.isAuthenticated() && (req.user.role ==="l2" || req.user.role ==="l3")) {
            return next();
        } else {
            req.logout();
            if (req.session){
                req.session.destroy(function (error) {
                    if (error) {
                        console.log(error)
                    }
                    return res.render("login");

                })
            }else {
                res.render("login");
            }





        }

    },

    checkForLevel_Three: (req, res, next) =>{
        if (req.isAuthenticated() && req.user.role ==="l3") {
            return next();
        } else {
            req.logout();
            if (req.session){
                req.session.destroy(function (error) {
                    if (error) {
                        console.log(error)
                    }
                    return res.render("login");

                })
            }else {
                res.render("login");

            }





        }

    }




}
