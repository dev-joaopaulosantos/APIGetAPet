const jwt = require('jsonwebtoken')

const createUserToken = async (user, req, res) => {
    // cria o token
    const token = jwt.sign({
        name: user.name,
        id: user._id
    }, "nossosecret")

    // Retorna o token
    res.status(200).json({
        message: 'Você está autenticado!',
        token: token,
        userId: user._id,
    })
}

module.exports = createUserToken