const nodemailer = require('nodemailer');
const cron =  require('node-cron');
const env = require('dotenv').config();

const firebase = require('./db');
const Medication = require('./models/medication');
const firestore = firebase.firestore();



const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USER,
        pass: process.env.PASS
    }
});



function updateNotificao(id, date){
    firestore.collection('meds').doc(id).update({ultimaNotificacao : date});
    console.log('atualizado a ultima notificação para a :', date);
}

const getMeds = async () => {
    try {
        const medsRef = firestore.collection('meds');
        const data = await medsRef.where('ativo', '==', 'S').get();
        const medsArray = [];
        data.forEach(doc => {
            const medication = new Medication(
                doc.id,
                doc.data().nome,
                doc.data().qtd,
                doc.data().horario,
                doc.data().acada,
                doc.data().ativo,
                doc.data().email,
                doc.data().ultimaNotificacao
            );
            medsArray.push(medication);
        });
        return medsArray;
    } catch (error) {
        throw(error);
    }
}

function enviarEmail (nome, qtd, horario, email) {
    console.log('chamada para email');
    let mailOptions = {
        from : 'fabinho.alves91@gmail.com',
        to: email,
        subject: 'MedReminder mandou um aviso',
        text: `Olá, agora as ${horario}, você deve tomar ${qtd} de ${nome}`
    }
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error)
        } else {
            console.log('email send: '+ info.response);
        }
    })
}

function enviarHorarioPadrao(){
    
}

cron.schedule('1 * * * * *', () =>{

    getMeds().then((resolve, reject) => {
        resolve.forEach(item => {
            let [hora, minuto] = item.horario.split(':');
            let [h1, m1] = item.acada.split(':');
            let data = new Date();
            let iniciaAlarm = new Date();
            let acabaAlarm = new Date();
            let iniciaAlarm12 = new Date();
            let acabaAlarm12 = new Date();
            let ultimaNot = new Date();

            if (h1 == '24') {
                iniciaAlarm.setHours(hora, minuto, 0);
                acabaAlarm.setHours(hora, minuto, 59);
                if(data >= iniciaAlarm && data < acabaAlarm ){
                    enviarEmail(item.nome, item.qtd, item.horario, item.email)
                }       
            }

            else if (h1 == '12') {
                iniciaAlarm.setHours(hora, minuto, 0);
                acabaAlarm.setHours(hora, minuto, 59);
                iniciaAlarm12.setHours(hora, minuto, 0);
                acabaAlarm12.setHours(hora, minuto, 59);
                if (hora > 12) {
                    iniciaAlarm12.setTime(iniciaAlarm12.getTime() - (h1*60*60*1000));
                    acabaAlarm12.setTime(acabaAlarm12.getTime() - (h1*60*60*1000));
                } else {
                    iniciaAlarm12.setTime(iniciaAlarm12.getTime() + (h1*60*60*1000));
                    acabaAlarm12.setTime(acabaAlarm12.getTime() + (h1*60*60*1000));
                }
                let h12  = iniciaAlarm12.getHours(); 
                let m12 = iniciaAlarm12.getMinutes();
                let horario12 = h12 + ':' + m12;
                if (data >= iniciaAlarm && data < acabaAlarm) {
                    enviarEmail(item.nome, item.qtd, item.horario, item.email)
                }   
                else if (data >= iniciaAlarm12 && data < acabaAlarm12) {
                    enviarEmail(item.nome, item.qtd, horario12, item.email)
                }
            }



            else {
                if (item.ultimaNotificacao == null) {
                    if (minuto < data.getMinutes()) {
                        if (hora < data.getHours() ) {
                            ultimaNot.setHours(hora, minuto, 0);
                            updateNotificao(item.id, ultimaNot);
                        }                  
                    }
                    if (hora < data.getHours() ) {
                        ultimaNot.setHours(hora, minuto, 0);
                        updateNotificao(item.id, ultimaNot);
                    }    
                    
                        
                    iniciaAlarm.setHours(hora, minuto, 0);
                    acabaAlarm.setHours(hora, minuto, 59);
                    if (data >= iniciaAlarm && data < acabaAlarm) {
                        let ndate = new Date();
                        ndate.setSeconds(0);
                        enviarEmail(item.nome, item.qtd, item.horario, item.email)
                        updateNotificao(item.id, ndate);
                    }  
                    
                } else {
                    ultimaNot = item.ultimaNotificacao.toDate();
                    ultimaNot.setTime(ultimaNot.getTime() + (h1*60*60*1000));
                    iniciaAlarm.setHours(ultimaNot.getHours(), ultimaNot.getMinutes(), 0);
                    acabaAlarm.setHours(ultimaNot.getHours(), ultimaNot.getMinutes(), 59);
                    if (data >= iniciaAlarm && data < acabaAlarm) {
                        let h12  = iniciaAlarm.getHours(); 
                        let m12 = iniciaAlarm.getMinutes();
                        let horario12 = h12 + ':' + m12;
                        enviarEmail(item.nome, item.qtd, horario12, item.email)
                        let ndate = new Date();
                        ndate.setSeconds(0);
                        updateNotificao(item.id, ndate);
                    }  
                }

            }
        })
    }).catch(err => console.log(err))
})