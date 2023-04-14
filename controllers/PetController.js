const Pet = require('../models/Pet')

// helpers
const getToken = require('../helpers/get-token')
const getUserByToken = require('../helpers/get-user-by-token')
const ObjectId = require('mongoose').Types.ObjectId

module.exports = class PetController {

    static async create(req, res) {
        const { name, age, weigth, color } = req.body

        const images = req.files
        const available = true

        if (!name) {
            res.status(422).json({ message: "O nome é obrigatório!" })
            return
        }
        if (!age) {
            res.status(422).json({ message: "A idade é obrigatória!" })
            return
        }
        if (!weigth) {
            res.status(422).json({ message: "O peso é obrigatório!" })
            return
        }
        if (!color) {
            res.status(422).json({ message: "A cor é obrigatória!" })
            return
        }
        if (images.length === 0) {
            res.status(422).json({ message: "A imagem é obrigatória!" })
            return
        }

        // Pegar o domo do pet
        const token = getToken(req)
        const user = await getUserByToken(token)

        // Cria o pet
        const pet = new Pet({
            name,
            age,
            weigth,
            color,
            available,
            images: [],
            user: {
                _id: user._id,
                name: user.name,
                image: user.image,
                phone: user.phone
            }
        })

        images.map((image) => {
            pet.images.push(image.filename)
        })

        try {
            const newPet = await pet.save()
            res.status(201).json({ message: "Pet cadastrado com sucesso!", newPet })
        } catch (error) {
            res.status(500).json({ message: error })
        }
    }

    static async getAll(req, res) {
        const pets = await Pet.find().sort('-createdAt')

        res.status(200).json({ pets })
    }

    static async getAllUserPets(req, res) {

        // pega usuario pelo token
        const token = getToken(req)
        const user = await getUserByToken(token)

        const pets = await Pet.find({ 'user._id': user._id }).sort('-createdAt')

        res.status(200).json({ pets })
    }

    static async getAllUserAdoptions(req, res) {

        // pega usuario pelo token
        const token = getToken(req)
        const user = await getUserByToken(token)

        const pets = await Pet.find({ 'adopter._id': user._id }).sort('-createdAt')

        res.status(200).json({ pets })
    }

    static async getPetById(req, res) {
        const id = req.params.id

        if (!ObjectId.isValid(id)) {
            res.status(422).json({ message: "Id inválido!" })
            return
        }

        const pet = await Pet.findOne({ _id: id })

        if (!pet) {
            res.status(404).json({ message: "Pet não encontrado!" })
            return
        }
        res.status(200).json({ pet })
    }

    static async removePetById(req, res) {
        const id = req.params.id

        if (!ObjectId.isValid(id)) {
            res.status(422).json({ message: "Id inválido!" })
            return
        }

        const pet = await Pet.findOne({ _id: id })

        if (!pet) {
            res.status(404).json({ message: "Pet não encontrado!" })
            return
        }

        // verifica se o usuario logado registrou o pet que ta tentando deletar
        const token = getToken(req)
        const user = await getUserByToken(token)

        if (pet.user._id.toString() !== user._id.toString()) {
            res.status(422).json({ message: "Houve um problema ao processar a sua solicitação!" })
            return
        }

        await Pet.findByIdAndRemove(id)
        res.status(200).json({ message: "Pet removido com sucesso!" })

    }

    static async updatePet(req, res) {
        const id = req.params.id

        const { name, age, weigth, color, available } = req.body

        const images = req.files

        const updatedData = {}

        // verifica se o pet existe
        const pet = await Pet.findOne({ _id: id })

        if (!pet) {
            res.status(404).json({ message: "Pet não encontrado!" })
            return
        }

        // verifica se o usuario logado registrou o pet que ta tentando editar
        const token = getToken(req)
        const user = await getUserByToken(token)

        if (pet.user._id.toString() !== user._id.toString()) {
            res.status(422).json({ message: "Houve um problema ao processar a sua solicitação!" })
            return
        }

        if (!name) {
            res.status(422).json({ message: "O nome é obrigatório!" })
            return
        } else {
            updatedData.name = name
        }
        if (!age) {
            res.status(422).json({ message: "A idade é obrigatória!" })
            return
        } else {
            updatedData.age = age
        }
        if (!weigth) {
            res.status(422).json({ message: "O peso é obrigatório!" })
            return
        } else {
            updatedData.weigth = weigth
        }
        if (!color) {
            res.status(422).json({ message: "A cor é obrigatória!" })
            return
        } else {
            updatedData.color = color
        }
        if (images.length > 0) {
            updatedData.images = []
            images.map((image) => {
                updatedData.images.push(image.filename)
            })
        }

        await Pet.findByIdAndUpdate(id, updatedData)
        res.status(200).json({ message: "Pet atualizado com sucesso!" })
    }

    static async schedule(req, res) {
        const id = req.params.id

        // verifica se o pet existe
        const pet = await Pet.findOne({ _id: id })

        if (!pet) {
            res.status(404).json({ message: "Pet não encontrado!" })
            return
        }

        // verifica se o usuario logado registrou o pet que ta tentando editar// usuario não pode adotar seu proprio pet
        const token = getToken(req)
        const user = await getUserByToken(token)

        if (pet.user._id.equals(user._id)) {
            res.status(422).json({ message: "Você não pode agentar uma visita para seu próprio pet!" })
            return
        }
        // verifica se o usuario já não agendou uma visita para esse pet
        if (pet.adopter) {
            if (pet.adopter._id.equals(user._id)) {
                res.status(422).json({ message: "Você já agendou uma visita para esse pet!" })
                return
            }
        }

        // add usuario como adotante do pet
        pet.adopter = {
            _id: user._id,
            name: user.name,
            image: user.image
        }

        await Pet.findByIdAndUpdate(id, pet)
        res.status(200).json({ message: `A visita foi agendada com sucesso, entre em contato com: ${pet.user.name}, pelo telefone: ${pet.user.phone}` })

    }

    static async concludeAdoption(req, res) {
        const id = req.params.id

        // verifica se o pet existe
        const pet = await Pet.findOne({ _id: id })

        if (!pet) {
            res.status(404).json({ message: "Pet não encontrado!" })
            return
        }


        // verifica se o usuario logado registrou o pet que ta tentando confirmar a dodoção
        const token = getToken(req)
        const user = await getUserByToken(token)

        if (pet.user._id.toString() !== user._id.toString()) {
            res.status(422).json({ message: "Houve um problema ao processar a sua solicitação!" })
            return
        }

        pet.available = false

        await Pet.findByIdAndUpdate(id, pet)
        res.status(200).json({ message: "Parabéns! o ciclo de adoção foi finalizado com sucesso!" })
    }
}
