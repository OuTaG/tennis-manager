// Courtside : contrôleur principal de l'app, qui enregistre les modules
// natifs propres au jeu (GameCenterPlugin). Dans Main.storyboard, la classe
// du contrôleur « Bridge View Controller » doit être MainViewController.
import UIKit
import Capacitor

class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(GameCenterPlugin())
    }
}
