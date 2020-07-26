const express = require("express");

const router = express.Router();
const { User } = require("../models/User");
const { auth } = require("../middleware/auth");
const { OAuth2Client } = require("google-auth-library");

router.post("/register", (req, res) => {
  //회원 가입 할떄 필요한 정보들을  client에서 가져오면
  //그것들을  데이터 베이스에 넣어준다.

  const user = new User(req.body);

  user.save((err, userInfo) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).json({
      success: true,
    });
  });
});

router.post("/login", (req, res) => {
  // console.log('ping')
  //요청된 이메일을 데이터베이스에서 있는지 찾는다.
  User.findOne({ email: req.body.email }, (err, user) => {
    // console.log('user', user)
    if (!user) {
      return res.json({
        loginSuccess: false,
        message: "제공된 이메일에 해당하는 유저가 없습니다.",
      });
    }

    //요청된 이메일이 데이터 베이스에 있다면 비밀번호가 맞는 비밀번호 인지 확인.
    user.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch)
        return res.json({
          loginSuccess: false,
          message: "비밀번호가 틀렸습니다.",
        });

      //비밀번호 까지 맞다면 토큰을 생성하기.
      user.generateToken((err, user) => {
        if (err) return res.status(400).send(err);

        // 토큰을 저장한다.  어디에 ?  쿠키 , 로컬스토리지
        res
          .cookie("x_auth", user.token)
          .status(200)
          .json({ loginSuccess: true, userId: user._id });
      });
    });
  });
});

// role 1 어드민    role 2 특정 부서 어드민
// role 0 -> 일반유저   role 0이 아니면  관리자
router.get("/auth", auth, (req, res) => {
  //여기 까지 미들웨어를 통과해 왔다는 얘기는  Authentication 이 True 라는 말.
  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    image: req.user.image,
  });
});

router.get("/logout", auth, (req, res) => {
  User.findOneAndUpdate({ _id: req.user._id }, { token: "" }, (err, user) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).send({
      success: true,
    });
  });
});

router.get("/management", (req, res) => {
  User.find({}).exec((err, info) => {
    if (err) return res.status(400).send(err);

    res.status(200).json({ success: true, users: info });
  });
});

router.post("/removeFromUsers", (req, res) => {
  User.findOneAndDelete({
    email: req.body.email,
  }).exec((err, result) => {
    if (err) return res.status(400).send(err);
    return res.status(200).json({ success: true });
  });
});

router.post("/getUserInfo", (req, res) => {
  User.find({ _id: req.body.userId }).exec((err, user) => {
    if (err) return res.status(400).send(err);
    return res.status(200).json({ success: true, user });
  });
});

router.post("/updateProfile", (req, res) => {
  User.findOne({ _id: req.body.id }, (err, user) => {
    if (err) return res.json({ success: false, err });
    user.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch) {
        return res.json({
          loginSuccess: false,
          message: "비밀번호를 잘못 입력했습니다.",
        });
      }
      User.updateOne(
        { _id: user._id },
        {
          $set: {
            password: req.body.newPassword,
            image: req.body.newImage,
          },
        },
        (err, user) => {
          if (err) return res.json({ success: false, err });
          res.status(200).json({ success: true, user });
        }
      );
    });
  });
});

const client = new OAuth2Client(
  "929257267887-jabje0s2v9gdvfrm1avh5qr1q63j9p91.apps.googleusercontent.com"
);

router.post("/googlelogin", (req, res) => {
  const { tokenId } = req.body;

  client
    .verifyIdToken({
      idToken: tokenId,
      audience:
        "929257267887-jabje0s2v9gdvfrm1avh5qr1q63j9p91.apps.googleusercontent.com",
    })
    .then((response) => {
      const { email_verified, name, email } = response.payload;

      console.log(response.payload);

      if (email_verified) {
        User.findOne({ email }).exec((err, user) => {
          if (err) {
            return res.status(400).json({
              error: "Something went wrong...",
            });
          } else {
            if (user) {

            
                  //비밀번호 까지 맞다면 토큰을 생성하기.
                  user.generateToken((err, user) => {
                    if (err) return res.status(400).send(err);
            
                    // 토큰을 저장한다.  어디에 ?  쿠키 , 로컬스토리지
                    res
                      .cookie("x_auth", user.token)
                      .status(200)
                      .json({ loginSuccess: true, userId: user._id });
                  });
                
            

            } else {


              let password = email + "google";
              const newUser = new User({email, name, password});

         
              
            
  
            
                  //비밀번호 까지 맞다면 토큰을 생성하기.
                  newUser.generateToken((err, user) => {
                    if (err) return res.status(400).send(err);
            
                    // 토큰을 저장한다.  어디에 ?  쿠키 , 로컬스토리지
                    res
                      .cookie("x_auth", user.token)
                      .status(200)
                      .json({ loginSuccess: true, userId: user._id });
                  });
                
              



            }
          }
        });
      }
    });
});

module.exports = router;
