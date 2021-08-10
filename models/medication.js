class Medication {
    constructor(id, nome, qtd, horario, acada,
        ativo, email, ultimaNotificacao ) {
            this.id = id;
            this.nome = nome;
            this.qtd = qtd;
            this.horario = horario;
            this.acada = acada;
            this.ativo = ativo;
            this.email = email;
            this.ultimaNotificacao = ultimaNotificacao;

    }
}

module.exports = Medication;