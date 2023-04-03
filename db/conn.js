const mongoose = require("mongoose");

async function main() {

    mongoose.set("strictQuery", true);
    await mongoose.connect("mongodb+srv://getapet:XopMtcSlIZaT3mCz@cluster0.ofbzbwp.mongodb.net/?retryWrites=true&w=majority");
    console.log("Conectado ao Banco de dados!")
};
main().catch((err) => console.log(err))

module.exports = mongoose


// const dbConn = await mongoose.connect("mongodb+srv://getapet:XopMtcSlIZaT3mCz@cluster0.ofbzbwp.mongodb.net/?retryWrites=true&w=majority");
