const fs = require('fs');
const { KeyPairEd25519 } = require("near-api-js/lib/utils/key_pair");
const Base58 = require("base-58");

(async () => {
    const keyPair = KeyPairEd25519.fromRandom()
    const { secretKey } = keyPair

    fs.writeFile("./generatedKeys.js", `{"privateKey":"${secretKey}","publicKey":"${Base58.encode(keyPair.getPublicKey().data)}"}`, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });
})();
