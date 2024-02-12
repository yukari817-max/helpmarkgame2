//起動時の処理
function setup(){
    canvasSize(1200, 720);
    loadImg(0, "image/bg.png");
    loadImg(1, "image/spaceship.png");
    loadImg(2, "image/missile.png");
    loadImg(3, "image/explode.png");
    for(var i=0; i<=4; i++) loadImg(4+i, "image/enemy"+i+".png");
    for(var i=0; i<=2; i++) loadImg(9+i, "image/item"+i+".png");
    loadImg(12, "image/laser.png");
    loadImg(13, "image/title_ss.png");
    initSShip();
    initMissile();
    initObject();
    loadSound(0, "sound/bgm.m4a");
}

//メインループ
function mainloop(){
    tmr++;
    drawBG(1);
    switch(idx) {
        case 0://タイトル画面
        drawImg(13, 200, 200);
        if(tmr%40 < 20)fText("Press [SPC] or Click to start.", 600, 540, 40, "cyan");
        if(key[32]>0 || tapC>0) {
            initSShip();
            initObject();
            score = 0;
            stage = 1;
            idx = 1;
            tmr = 0;
            playBgm(0);
        }
        break;

        case 1://ゲーム中
        setEnemy();
        setItem();
        moveSShip();
        moveMissile();
        moveObject();
        drawEffect();
        for(i=0; i<10; i++) fRect(20+i*30, 660, 20, 40, "#c00000");
        for(i=0; i<energy; i++) fRect(20+i*30, 660, 20, 40, colorRGB(160-16*i, 240-12*i, 24*i));
        if(tmr < 30*4) fText("STAGE "+stage, 600, 300, 50, "cyan");
        if(30*114 < tmr && tmr < 30*118) fText("STAGE CLEAR", 600, 300, 50, "cyan");
        if(tmr == 30*120) {
            stage++;
            tmr = 0;
        }
        break;

        case 2://ゲームオーバー
        if(tmr < 30*2 && tmr%5 == 1) setEffect(ssX+rnd(120)-60, ssY+rnd(80)-40, 9);
        moveMissile();
        moveObject();
        drawEffect();
        fText("GAME OVER", 600, 300, 50, "red");
        if(tmr > 30*5) idx = 0;
        break;

    }
    fText("SCORE "+score, 200, 50, 40, "white");
    fText("HISCORE "+hisco, 600, 50, 40, "yellow");
}

//背景のスクロール
var bgX = 0;
function drawBG(spd) {
    bgX = (bgX + spd)%1200;
    drawImg(0, -bgX, 0);
    drawImg(0, 1200-bgX, 0);
    var hy = 580;//地面の地平線のY座標
    var ofsx = bgX%40;//縦のラインを移動させるオフセット値
    lineW(2);
    for(var i=1; i<=30; i++) {//縦のライン
        var tx = i*40-ofsx;
        var bx = i*240-ofsx*6-3000;
        line(tx, hy, bx, 720, "silver");
    }
    for(var i=1; i<12; i++) {//横のライン
        lineW(1+int(i/3));
        line(0, hy, 1200, hy, "gray");
        hy = hy + i*2;
    }
}

//ゲームの進行を管理する変数
var idx = 0;
var tmr = 0;

var score = 0;//スコア
var hisco = 10000;//ハイスコア
var stage = 0;//ステージ数

//自機の管理
var ssX = 0;
var ssY = 0;
var automa = 0;//弾の自動発射
var enemgy = 0;//エネルギー
var muteki = 0;//無敵状態
var weapon = 0;//武器のパワーアップ
var laser = 0;//レーザーの使用回数

function initSShip() {
    ssX = 400;
    ssY = 360;
    energy = 10;
    muteki = 0;
    weapon = 0;
    laser = 0;
}

function moveSShip() {
    if(key[37] > 0 && ssX > 60) ssX -= 20;
    if(key[39] > 0 && ssX < 1000) ssX += 20;
    if(key[38] > 0 && ssY > 40) ssY -= 20;
    if(key[40] > 0 && ssY < 680) ssY += 20;
    if(key[65] == 1) {
        key[65]++;
        automa = 1-automa;
    }
    if(automa == 0 && key[32] == 1) {
        key[32]++;
        setWeapon();
    }
    if(automa == 1 && tmr%8 == 0) setWeapon();
    var col = "black";
    if(automa == 1) col = "white";
    fRect(900, 20, 280, 60, "blue");
    fText("[A]uto Missile", 1040, 50, 36, col);

    if(tapC > 0) {//タップ操作
        if(900<tapX && tapX<1180 && 20<tapY && tapY<80) {
            tapC = 0;
            automa = 1-automa;
        }
        else {
            ssX = ssX + int((tapX-ssX)/6);
            ssY = ssY + int((tapY-ssY)/6);
        }
    }

    if(muteki%2 == 0) drawImgC(1, ssX, ssY);
    if(muteki > 0) muteki--;
}

function setWeapon() {//複数の弾を同時にセットするための関数
    var n = weapon;
    if(n > 8) n = 8;
    for(var i=0; i<=n; i++) setMissile(ssX+40, ssY-n*6+i*12, 40, int((i-n/2)*2));
}

//自機が撃つ弾の管理
var MSL_MAX = 100;
var mslX = new Array(MSL_MAX);
var mslY = new Array(MSL_MAX);
var mslXp = new Array(MSL_MAX);
var mslYp = new Array(MSL_MAX);
var mslF = new Array(MSL_MAX);
var mslImg = new Array(MSL_MAX);
var mslNum = 0;

function initMissile() {
    for(var i=0; i<MSL_MAX; i++) mslF[i] = false;
    mslNum = 0;
}

function setMissile(x, y, xp, yp) {
    mslX[mslNum] = x;
    mslY[mslNum] = y;
    mslXp[mslNum] = xp;
    mslYp[mslNum] = yp;
    mslF[mslNum] = true;
    mslImg[mslNum] = 2;
    if(laser > 0) {//レーザー
        laser--;
        mslImg[mslNum] = 12;
    }
    mslNum = (mslNum+1)%MSL_MAX;
}

function moveMissile() {
    for(var i=0; i<MSL_MAX; i++) {
        if(mslF[i] == true) {
            mslX[i] = mslX[i] + mslXp[i];
            mslY[i] = mslY[i] + mslYp[i];
            drawImgC(mslImg[i], mslX[i], mslY[i]);
            if(mslX[i] > 1200) mslF[i] = false;
        }
    }
}

//物体の管理　敵機、敵の弾、アイテムを管理する
var OBJ_MAX = 100;
var objType = new Array(OBJ_MAX);//0=敵の弾 1=敵機 2=アイテム
var objImg = new Array(OBJ_MAX);
var objX = new Array(OBJ_MAX);
var objY = new Array(OBJ_MAX);
var objXp = new Array(OBJ_MAX);
var objYp = new Array(OBJ_MAX);
var objLife = new Array(OBJ_MAX);
var objF = new Array(OBJ_MAX);
var objNum = 0;

function initObject() {
    for(var i=0; i<OBJ_MAX; i++) objF[i] = false;
    objNum = 0;
}

function setObject(typ, png, x, y, xp, yp, lif) {
    objType[objNum] = typ;
    objImg[objNum] = png;
    objX[objNum] = x;
    objY[objNum] = y;
    objXp[objNum] = xp;
    objYp[objNum] = yp;
    objLife[objNum] = lif;
    objF[objNum] = true;
    objNum = (objNum+1)%OBJ_MAX;
}

function moveObject() {
    for(var i=0; i<OBJ_MAX; i++) {
        if(objF[i] == true) {
            objX[i] = objX[i] + objXp[i];
            objY[i] = objY[i] + objYp[i];
            if(objImg[i] == 6) {//敵2の特殊な動き
                if(objY[i] < 60) objYp[i] = 8;
                if(objY[i] > 660) objYp[i] = -8;
            }
            if(objImg[i] == 7) {//敵3の特殊な動き
                if(objXp[i] < 0) {
                    objXp[i] = int(objXp[i]*0.95);
                    if(objXp[i] == 0) {
                        setObject(0, 4, objX[i], objY[i], -20, 0, 0);//弾を撃つ
                        objXp[i] = 20;
                    }
                }
            }
            drawImgC(objImg[i], objX[i], objY[i]);//物体の表示
            //自機が撃った弾とヒットチェック
            if(objType[i] == 1) {//敵機
                var r = 12+(img[objImg[i]].width+img[objImg[i]].height)/4;//ヒットチェックの径(距離)
                for(var n=0; n<MSL_MAX; n++) {
                    if(mslF[n] == true) {
                        if(getDis(objX[i], objY[i], mslX[n], mslY[n]) < r) {
                            if(mslImg[n] == 2) mslF[n] = false;//通常弾と貫通弾の違い
                            objLife[i]--;
                            if(objLife[i] == 0) {
                                objF[i] = false;
                                score = score + 100;
                                if(score > hisco) hisco = score;
                                setEffect(objX[i], objY[i], 9);
                            }
                            else {
                                setEffect(objX[i], objY[i], 3);
                            }
                        }
                    }
                }
            }
            //自機とのヒットチェック
            if(idx == 1) {//ゲーム中のみ
                var r = 30+(img[objImg[i]].width+img[objImg[i]].height)/4;//ヒットチェックの径(距離)
                if(getDis(objX[i], objY[i], ssX, ssY) < r) {
                    if(objType[i] <= 1 && muteki == 0) {//敵の弾と敵機
                        objF[i] = false;
                        setEffect(objX[i], objY[i], 9);
                        energy--;
                        muteki = 30;
                        if(energy == 0) {//エネルギー0でゲームオーバーへ
                            idx = 2;
                            tmr = 0;
                            stopBgm();
                        }
                    }
                    if(objType[i] == 2) {//アイテム
                        objF[i] = false;
                        if(objImg[i] == 9 && energy < 10) energy++;
                        if(objImg[i] ==10) weapon++;
                        if(objImg[i] ==11) laser = laser + 100;
                    }
                }
            }
            if(objX[i]<-100 || objX[i]>1300 || objY[i]<-100 || objY[i]>820) objF[i] = false;
        }
    }
}

//エフェクト（爆発演出）の管理
var EFCT_MAX = 100;
var efctX = new Array(EFCT_MAX);
var efctY = new Array(EFCT_MAX);
var efctN = new Array(EFCT_MAX);
var efctNum = 0;

function initEffect() {
    for(var i=0; i<EFCT_MAX; i++) efctN[i] = 0;
    efctNum = 0;
}

function setEffect(x, y, n) {
    efctX[efctNum] = x;
    efctY[efctNum] = y;
    efctN[efctNum] = n;
    efctNum = (efctNum+1)%EFCT_MAX;
}

function drawEffect() {
    for(var i=0; i<EFCT_MAX; i++) {
        if(efctN[i] > 0) {
            drawImgTS(3, (9-efctN[i])*128, 0, 128, 128, efctX[i]-64, efctY[i]-64, 128, 128);
            efctN[i]--;
        }
    }
}

//敵をセットする
function setEnemy() {
    var sec = int(tmr/30);//経過秒数
    if( 4<= sec && sec <10) {
        if(tmr%20 == 0) setObject(1, 5, 1300, 60+rnd(600), -16, 0, 1*stage);//敵機1
    }
    if(14<= sec && sec <20) {
        if(tmr%20 == 0) setObject(1, 6, 1300, 60+rnd(600), -12, 8, 3*stage);//敵機2
    }
    if(24<= sec && sec <30) {
        if(tmr%20 == 0) setObject(1, 7, 1300, 360+rnd(300), -48, -10, 5*stage);//敵機3
    }
    if(34<= sec && sec <50) {
        if(tmr%60 == 0) setObject(1, 8, 1300, rnd(720-192), -6, 0, 0);//障害物
    }
    if(54<= sec && sec <70) {
        if(tmr%20 == 0) {
            setObject(1, 5, 1300,  60+rnd(300), -16,  4, 1*stage);//敵機1
            setObject(1, 5, 1300, 360+rnd(300), -16, -4, 1*stage);//敵機1
        }
    }
    if(74<= sec && sec <90) {
        if(tmr%20 == 0) setObject(1, 6, 1300, 60+rnd(600), -12, 8, 3*stage);//敵機2
        if(tmr%45 == 0) setObject(1, 8, 1300, rnd(720-192), -8, 0, 0);//障害物
    }
    if(94<= sec && sec <110) {
        if(tmr%10 == 0) setObject(1, 5, 1300, 360, -24, rnd(11)-5, 1*stage);//敵機1
        if(tmr%20 == 0) setObject(1, 7, 1300, rnd(300), -56, 4+rnd(12), 5*stage);//敵機3
    }
}

//アイテムをセットする
function setItem() {
    if(tmr%900 ==   0) setObject(2,  9, 1300, 60+rnd(600), -10, 0, 0);// Energy
    if(tmr%900 == 300) setObject(2, 10, 1300, 60+rnd(600), -10, 0, 0);// Missile
    if(tmr%900 == 600) setObject(2, 11, 1300, 60+rnd(600), -10, 0, 0);// Laser
}
