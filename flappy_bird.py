import pygame
import sys
import random

# Initialize pygame
pygame.init()

# Game constants
SCREEN_WIDTH = 400
SCREEN_HEIGHT = 600
GRAVITY = 0.25
BIRD_JUMP = -5
PIPE_GAP = 150
PIPE_FREQUENCY = 1500  # milliseconds
PIPE_SPEED = 5
FLOOR_HEIGHT = 100

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GREEN = (0, 128, 0)
BLUE = (0, 0, 255)
RED = (255, 0, 0)
SKY_BLUE = (135, 206, 235)

# Set up the display
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption('Flappy Bird - Python Version')
clock = pygame.time.Clock()
font = pygame.font.SysFont('Arial', 30)

# Bird class
class Bird:
    def __init__(self):
        self.x = 100
        self.y = SCREEN_HEIGHT // 2
        self.velocity = 0
        self.width = 40
        self.height = 30
        self.alive = True
    
    def jump(self):
        self.velocity = BIRD_JUMP
    
    def move(self):
        # Apply gravity
        self.velocity += GRAVITY
        self.y += self.velocity
        
        # Check boundaries
        if self.y < 0:
            self.y = 0
            self.velocity = 0
        if self.y + self.height > SCREEN_HEIGHT - FLOOR_HEIGHT:
            self.y = SCREEN_HEIGHT - FLOOR_HEIGHT - self.height
            self.velocity = 0
            self.alive = False
    
    def draw(self):
        pygame.draw.rect(screen, RED, (self.x, self.y, self.width, self.height))
        # Draw eye
        pygame.draw.circle(screen, WHITE, (self.x + 30, self.y + 10), 8)
        pygame.draw.circle(screen, BLACK, (self.x + 32, self.y + 10), 4)
        # Draw beak
        pygame.draw.polygon(screen, (255, 165, 0), [(self.x + 40, self.y + 15), 
                                                   (self.x + 50, self.y + 15), 
                                                   (self.x + 40, self.y + 25)])
    
    def get_mask(self):
        return pygame.Rect(self.x, self.y, self.width, self.height)

# Pipe class
class Pipe:
    def __init__(self):
        self.x = SCREEN_WIDTH
        self.height = random.randint(100, 300)
        self.top_pipe = pygame.Rect(self.x, 0, 60, self.height)
        self.bottom_pipe = pygame.Rect(self.x, self.height + PIPE_GAP, 60, SCREEN_HEIGHT)
        self.passed = False
    
    def move(self):
        self.x -= PIPE_SPEED
        self.top_pipe.x = self.x
        self.bottom_pipe.x = self.x
    
    def draw(self):
        pygame.draw.rect(screen, GREEN, self.top_pipe)
        pygame.draw.rect(screen, GREEN, self.bottom_pipe)
    
    def collide(self, bird):
        bird_mask = bird.get_mask()
        return bird_mask.colliderect(self.top_pipe) or bird_mask.colliderect(self.bottom_pipe)

# Game class
class Game:
    def __init__(self):
        self.bird = Bird()
        self.pipes = []
        self.score = 0
        self.last_pipe = pygame.time.get_ticks()
        self.game_over = False
    
    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE and not self.game_over:
                    self.bird.jump()
                if event.key == pygame.K_r and self.game_over:
                    self.__init__()
    
    def update(self):
        if not self.game_over:
            self.bird.move()
            
            # Generate new pipes
            time_now = pygame.time.get_ticks()
            if time_now - self.last_pipe > PIPE_FREQUENCY:
                self.pipes.append(Pipe())
                self.last_pipe = time_now
            
            # Move and check pipes
            for pipe in self.pipes:
                pipe.move()
                
                # Check for collision
                if pipe.collide(self.bird):
                    self.game_over = True
                
                # Check if pipe is passed
                if pipe.x + 60 < self.bird.x and not pipe.passed:
                    pipe.passed = True
                    self.score += 1
                
                # Remove pipes that are off screen
                if pipe.x < -60:
                    self.pipes.remove(pipe)
            
            # Check if bird is alive
            if not self.bird.alive:
                self.game_over = True
    
    def draw(self):
        # Draw background
        screen.fill(SKY_BLUE)
        
        # Draw bird
        self.bird.draw()
        
        # Draw pipes
        for pipe in self.pipes:
            pipe.draw()
        
        # Draw floor
        pygame.draw.rect(screen, (101, 67, 33), (0, SCREEN_HEIGHT - FLOOR_HEIGHT, SCREEN_WIDTH, FLOOR_HEIGHT))
        pygame.draw.rect(screen, (76, 153, 0), (0, SCREEN_HEIGHT - FLOOR_HEIGHT, SCREEN_WIDTH, 20))
        
        # Draw score
        score_text = font.render(f'Score: {self.score}', True, WHITE)
        screen.blit(score_text, (10, 10))
        
        # Draw game over message
        if self.game_over:
            game_over_text = font.render('Game Over! Press R to restart', True, WHITE)
            screen.blit(game_over_text, (SCREEN_WIDTH // 2 - 150, SCREEN_HEIGHT // 2))
        
        pygame.display.update()

# Main game loop
def main():
    game = Game()
    
    while True:
        clock.tick(60)
        game.handle_events()
        game.update()
        game.draw()

if __name__ == "__main__":
    main()
