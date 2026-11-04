// Courtside : module Capacitor « GameAudio », lecture audio native
// (AVAudioPlayer) des fichiers du dossier audio/ du jeu.
// Plus fiable que le son du WebView sur iPhone : volumes réglables, fondus,
// boucles, son même avec le bouton silencieux, pause quand l'app passe en
// arrière-plan. Méthodes appelées depuis src/engine/audio.js :
//   preload({ id, file, loop }), play({ id, volume, fade, restart }),
//   stop({ id, fade }), setVolume({ id, volume, fade }) ; évènement « ended ».
// Changement de sortie (AirPods, Bluetooth, haut-parleur) ou interruption
// (appel, Siri) : la session est réactivée et les sons en cours reprennent.
// Messages « [GameAudio] » dans la console Xcode pour le diagnostic.
import Foundation
import Capacitor
import AVFoundation

@objc(GameAudioPlugin)
public class GameAudioPlugin: CAPPlugin, CAPBridgedPlugin, AVAudioPlayerDelegate {
    public let identifier = "GameAudioPlugin"
    public let jsName = "GameAudio"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "preload", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "play", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setVolume", returnType: CAPPluginReturnPromise),
    ]

    private var players: [String: AVAudioPlayer] = [:]
    private var stopTokens: [String: Int] = [:]
    private var pausedInBackground: [String] = []
    private var wanted: Set<String> = [] // sons censés jouer (play sans stop)

    override public func load() {
        activateSession()
        NotificationCenter.default.addObserver(self, selector: #selector(sessionChanged), name: AVAudioSession.routeChangeNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(sessionChanged), name: AVAudioSession.interruptionNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(sessionChanged), name: AVAudioSession.mediaServicesWereResetNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(didEnterBackground), name: UIApplication.didEnterBackgroundNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(willEnterForeground), name: UIApplication.willEnterForegroundNotification, object: nil)
    }

    private func activateSession() {
        let session = AVAudioSession.sharedInstance()
        do {
            if session.category != .playback { try session.setCategory(.playback, mode: .default, options: []) }
            try session.setActive(true)
        } catch {
            print("[GameAudio] session audio : \(error)")
        }
    }

    // Sortie audio changée ou interruption terminée : on relance ce qui
    // devait jouer (iOS met parfois les lecteurs en pause).
    @objc private func sessionChanged(_ note: Notification) {
        if let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
           AVAudioSession.InterruptionType(rawValue: raw) == .began { return }
        if let raw = note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
           AVAudioSession.RouteChangeReason(rawValue: raw) == .categoryChange { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            guard UIApplication.shared.applicationState != .background else { return }
            self.activateSession()
            let route = AVAudioSession.sharedInstance().currentRoute.outputs.map { $0.portName }.joined(separator: ", ")
            print("[GameAudio] sortie : \(route)")
            for id in self.wanted { if let p = self.players[id], !p.isPlaying { p.play() } }
        }
    }

    @objc private func didEnterBackground() {
        pausedInBackground = players.filter { $0.value.isPlaying }.map { $0.key }
        pausedInBackground.forEach { players[$0]?.pause() }
    }

    @objc private func willEnterForeground() {
        activateSession()
        pausedInBackground.forEach { players[$0]?.play() }
        pausedInBackground = []
    }

    private func fileURL(_ file: String) -> URL? {
        guard let base = Bundle.main.resourceURL else { return nil }
        let url = base.appendingPathComponent("public").appendingPathComponent(file)
        return FileManager.default.fileExists(atPath: url.path) ? url : nil
    }

    @objc func preload(_ call: CAPPluginCall) {
        guard let id = call.getString("id"), let file = call.getString("file") else { call.reject("Paramètres manquants"); return }
        guard let url = fileURL(file) else { print("[GameAudio] fichier introuvable : " + file); call.reject("Fichier introuvable : " + file); return }
        do {
            let player = try AVAudioPlayer(contentsOf: url)
            player.numberOfLoops = call.getBool("loop", false) ? -1 : 0
            player.delegate = self
            player.prepareToPlay()
            DispatchQueue.main.async { self.players[id] = player; print("[GameAudio] prêt : " + file); call.resolve() }
        } catch {
            print("[GameAudio] lecture impossible : \(file) \(error)")
            call.reject("Lecture impossible : " + file)
        }
    }

    @objc func play(_ call: CAPPluginCall) {
        let id = call.getString("id") ?? ""
        let volume = Float(call.getDouble("volume") ?? 1)
        let fade = call.getDouble("fade") ?? 0
        let restart = call.getBool("restart", false)
        DispatchQueue.main.async {
            guard let p = self.players[id] else { call.reject("Son inconnu : " + id); return }
            self.stopTokens[id, default: 0] += 1 // annule un arrêt différé en cours
            self.wanted.insert(id)
            self.activateSession()
            if restart { p.currentTime = 0 }
            if fade > 0 {
                if !p.isPlaying { p.volume = 0 }
                if !p.play() { print("[GameAudio] lecture refusée : " + id) }
                p.setVolume(volume, fadeDuration: fade)
            } else {
                p.volume = volume
                if !p.play() { print("[GameAudio] lecture refusée : " + id) }
            }
            call.resolve()
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        let id = call.getString("id") ?? ""
        let fade = call.getDouble("fade") ?? 0
        DispatchQueue.main.async {
            guard let p = self.players[id] else { call.resolve(); return }
            self.stopTokens[id, default: 0] += 1
            self.wanted.remove(id)
            let token = self.stopTokens[id]!
            if fade > 0 && p.isPlaying {
                p.setVolume(0, fadeDuration: fade)
                DispatchQueue.main.asyncAfter(deadline: .now() + fade) {
                    if self.stopTokens[id] == token { p.stop(); p.currentTime = 0 }
                }
            } else {
                p.stop(); p.currentTime = 0
            }
            call.resolve()
        }
    }

    @objc func setVolume(_ call: CAPPluginCall) {
        let id = call.getString("id") ?? ""
        let volume = Float(call.getDouble("volume") ?? 1)
        let fade = call.getDouble("fade") ?? 0
        DispatchQueue.main.async {
            guard let p = self.players[id] else { call.resolve(); return }
            if fade > 0 { p.setVolume(volume, fadeDuration: fade) } else { p.volume = volume }
            call.resolve()
        }
    }

    public func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        if let id = players.first(where: { $0.value === player })?.key {
            wanted.remove(id)
            notifyListeners("ended", data: ["id": id])
        }
    }
}
