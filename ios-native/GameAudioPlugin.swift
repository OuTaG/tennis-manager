// Courtside : module Capacitor « GameAudio », lecture audio native
// (AVAudioPlayer) des fichiers du dossier audio/ du jeu.
// Plus fiable que le son du WebView sur iPhone : volumes réglables, fondus,
// boucles, son même avec le bouton silencieux, pause quand l'app passe en
// arrière-plan. Méthodes appelées depuis src/engine/audio.js :
//   preload({ id, file, loop }), play({ id, volume, fade, restart }),
//   stop({ id, fade }), setVolume({ id, volume, fade }) ; évènement « ended ».
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

    override public func load() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .default, options: [])
        try? session.setActive(true)
        NotificationCenter.default.addObserver(self, selector: #selector(didEnterBackground), name: UIApplication.didEnterBackgroundNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(willEnterForeground), name: UIApplication.willEnterForegroundNotification, object: nil)
    }

    @objc private func didEnterBackground() {
        pausedInBackground = players.filter { $0.value.isPlaying }.map { $0.key }
        pausedInBackground.forEach { players[$0]?.pause() }
    }

    @objc private func willEnterForeground() {
        try? AVAudioSession.sharedInstance().setActive(true)
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
        guard let url = fileURL(file) else { call.reject("Fichier introuvable : " + file); return }
        do {
            let player = try AVAudioPlayer(contentsOf: url)
            player.numberOfLoops = call.getBool("loop", false) ? -1 : 0
            player.delegate = self
            player.prepareToPlay()
            DispatchQueue.main.async { self.players[id] = player; call.resolve() }
        } catch {
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
            if restart { p.currentTime = 0 }
            if fade > 0 {
                if !p.isPlaying { p.volume = 0 }
                p.play()
                p.setVolume(volume, fadeDuration: fade)
            } else {
                p.volume = volume
                p.play()
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
            notifyListeners("ended", data: ["id": id])
        }
    }
}
