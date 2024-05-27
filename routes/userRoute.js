const express = require('express')
const router = express.Router()

const User = require('../models/userModel')
const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken')
const autMiddelware = require('../Middlewares/authMiddlware')

const Foot = require('../models/footModel');
const {generateReservationPDF,sendConfirmationEmail} = require('./nodemailer')




router.post('/register', async (req,res)=>{
try{
    const userExists = await User.findOne({email:req.body.email})
    if(userExists){
    return res.status(200).send({message:"votre email existe déjà",success:false})
    }
    const password = req.body.password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password,salt);
    req.body.password = hashedPassword
    const newuser = new User(req.body)
    await newuser.save();
    return res.status(200).send({message:"Votre Compte a été creer avec success",success:true})
}catch(error){
    res.status(500).send({message:"Quelque chose ne fonctionne pas",success:false,error})
}
})

router.post('/login',async (req,res)=>{
    try{
        const user = await User.findOne({email:req.body.email});
        if(!user){
            return res.status(200).send({message:"L'utilisateur n'existe pas",succes:false})
        }
        const isMatch = await bcrypt.compare(req.body.password,user.password)
        if(!isMatch){
            return res.status(200).send({message:"le mot de passe ne fonctionne pas",succes:false})
        }else{
            const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{
                expiresIn:"1d"
            })
            res.status(200).send({message:"connexion réussie",success:true,data:token})
        }
    }catch(error){
        console.log(error);
        res.status(500).send({message:"erreur de connexion",success:false,error})
    }

}
)


router.post('/get-user-info-by-id',autMiddelware,async(req,res)=>{
    try{
        const user = await User.findOne({_id:req.body.userId});
        user.password = undefined
        if(!user){
            return res.status(200).send({message:"User does not exists",success:false})
        }else{
            res.status(200).send({
                success:true,
                data:user,
            });
        }
    }catch(error){
        res.status(500).send({message:"Error getting user info",success:false,error})
    }
})

const formatTimings = (timings) => {
    return timings.map(timing => new Date(timing).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }));
};

router.post('/reservation', autMiddelware, async (req, res) => {
    try {
        // Créer une nouvelle réservation
        const newFoot = new Foot({ ...req.body, status: "pending" });
        await newFoot.save();

        // Récupérer l'utilisateur administrateur
        const adminUser = await User.findOne({ isAdmin: true });

        // Mettre à jour les notifications non vues de l'administrateur
        const unseenNotifications = adminUser.unseenNotifications;
        unseenNotifications.push({
            type: "demande de nouveau terrain",
            firstName: newFoot.firstName,
            lastName: newFoot.lastName,
            phoneNumber: newFoot.phoneNumber,
            adress: newFoot.adress,
            email: newFoot.email,
            timings: newFoot.timings.map(timing => new Date(timing)),
            message: `${newFoot.firstName} ${newFoot.lastName} a demandé une approbation de terrain.`,
            status: newFoot.status,
            data: {
                footId: newFoot._id,
                name: `${newFoot.firstName} ${newFoot.lastName}`
            },
            onClickPath: "/admin/Foot"
        });

        // Générer un PDF avec les détails de la réservation
        const pdfFilename = `reservation_${newFoot._id}`;
        generateReservationPDF(req.body, pdfFilename);

        // Envoyer un e-mail de confirmation avec le PDF en pièce jointe
        sendConfirmationEmail(newFoot.email, pdfFilename);

        // Mettre à jour les notifications non vues de l'administrateur dans la base de données
        await User.findByIdAndUpdate(adminUser._id, { unseenNotifications });

        // Répondre avec un message de réussite
        res.status(200).send({ message: "Application de terrain réussie", success: true });
    } catch (error) {
        // En cas d'erreur, répondre avec un message d'erreur
        res.status(500).send({ message: "Erreur lors de l'application du terrain", success: false, error });
    }
});




router.post('/mark-all-notification-as-seen', autMiddelware, async (req, res) => {
    try {
        const user = await User.findOne({_id:req.body.userId})
        const unseenNotifications = user.unseenNotifications;
        const seenNotifications = user.seenNotifications;
        seenNotifications.push(...unseenNotifications)
        user.unseenNotifications = [];
        user.seenNotifications = seenNotifications
        const updateUser = await user.save();
        updateUser.password = undefined
        res.status(200).send({success:true,message:"Toutes les notifications ont été vues",data:updateUser})
    } catch (error) {
      res.status(500).send({ message: "Erreur lors de l'application du terrain", success: false, error });
    }
  });


router.post('/delete-all-notifications', autMiddelware, async (req, res) => {
    try {
        const user = await User.findOne({_id:req.body.userId})
        user.seenNotifications = [];
        user.unseenNotifications = [];
        const updateUser = await user.save();
        updateUser.password = undefined
        res.status(200).send({success:true,message:"Toutes les notifications ont été supprimer",data:updateUser})
    } catch (error) {
      res.status(500).send({ message: "Erreur lors de l'application du terrain", success: false, error });
    }
  });
  





  router.get('/reservations', autMiddelware, async (req, res) => {
    try {
        const userId = req.body.userId;
        const reservations = await Foot.find({ userId });
        if (!reservations) {
            return res.status(200).send({ message: "Aucune réservation trouvée", success: false });
        }
        res.status(200).send({ success: true, data: reservations });
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de la récupération des réservations", success: false, error });
    }
});
router.delete('/delete-all-reservations', autMiddelware, async (req, res) => {
    try {
        const userId = req.body.userId;
        await Foot.deleteMany({ userId });
        res.status(200).send({ success: true, message: "Toutes les réservations ont été supprimées" });
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de la suppression des réservations", success: false, error });
    }
});








  router.get('/get-all-users',autMiddelware,async(req,res)=>{
    try{
        const Foot = await User.find({});
        res.status(200).send({message:"User fetched successfuly",success:true,data:Foot
    });
    }catch(error){
        res.status(500).send({message:"Eror appliying doctor accont",success:false,error});
    }
}); 



router.delete('/delete-user/:userId', autMiddelware, async (req, res) => {
    try {
        const userId = req.params.userId;
        await User.findByIdAndDelete(userId);
        res.status(200).send({ success: true, message: "Utilisateur supprimé avec succès" });
    } catch (error) {
        res.status(500).send({ message: "Erreur lors de la suppression de l'utilisateur", success: false, error });
    }
});


module.exports = router
