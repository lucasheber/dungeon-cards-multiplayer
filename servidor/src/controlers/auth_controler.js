const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//Arquivo json que guarda a chave unica da sua aplicação
const authConfig = require('../config/auth');

const User = require('../models/user');

const router = express.Router();

// Função pra gerar o token
function generateToken(params = {}){
    return jwt.sign( params, authConfig.secret, {
        expiresIn: 86490,
       })
}

router.get('/infoPlayers/:id', async (req, res) =>{
    const id = req.params.id

    //console.log("INFO_PLAYER : " + id)

    const user = await User.findOne({_id : id})

    if (!user)
        return res.send({ code:45, message: "ID não encontrado"})

    res.send({ 
        user: user, 
        token: generateToken({id : user.id}),
        code: 200
    });
})

router.post('/register', async (req,res)=> {
    const { email } = req.body;
    const { name } = req.body;
    try {
        if(await User.findOne({ email }))
            return res.status(400).send({ error : "Email já cadastrado."});
        if(await User.findOne({ name }))
            return res.status(400).send({ error : "Nome de usuário já está em uso."});


        const user = await User.create(req.body);
        user.password = undefined;

        res.send({ 
            user, 
            token: generateToken({id : user.id}) 
        });
    }catch (err){
        console.log(err);
        return res.status(400).send({error : 'Falha ao cadastrar usuario.'});
    }
});

router.post('/authenticate', async (req,res)=> {
    const { name, password } = req.body;

    console.log("Authenticate >> User : " + name + ", Password: " + password)

    const user = await User.findOne({ name}).select('+password');
    

    if (!user)
        return res.send({ message: "Nome de usuário não cadastrado."});

    if(!await bcrypt.compare(password, user.password))
        return res.status(400).send({ message: "Senha inválida."});
    
    user.password = undefined;

    res.send({ 
        user, 
        token: generateToken({id : user.id}),
        code: 200
    });

    //alterar usuario
});

module.exports = app => app.use('/users', router);
    