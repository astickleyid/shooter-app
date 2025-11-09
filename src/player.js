class PlayerEntity {
    constructor(name, health, speed) {
        this.name = name;
        this.health = health;
        this.speed = speed;
    }

    move(direction) {
        // Logic to move the player in the specified direction
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        console.log(`${this.name} has died.`);
    }
}

// Utility functions for player mechanics
function createPlayer(name, health, speed) {
    return new PlayerEntity(name, health, speed);
}

function revivePlayer(player, health) {
    player.health = health;
    console.log(`${player.name} has been revived with ${health} health.`);
}