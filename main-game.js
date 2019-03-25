
module.exports = {
    playerList: {},

    Player: function(name, id) {
        this.name = name;
        this.id = id;
        this.opponentName = '';
    },

    getOtherPlayers: function(selfPlayer) {
        let otherPlayers = {};

        for (var key in this.playerList) {
            if (this.playerList.hasOwnProperty(key)) {
                console.log(key + " -> " + this.playerList[key]);
                otherPlayers[key] = {
                    name: this.playerList[key].name,
                    opponentName: this.playerList[key].opponentName
                }
            }
        }

        return otherPlayers;
    },
};