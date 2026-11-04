// Courtside : module Capacitor « GameCenter » (classement en ligne).
// À ajouter au projet Xcode (dossier App/App), avec MainViewController.swift.
// Méthodes appelées depuis le jeu (src/engine/gamecenter.js) :
//   authenticate()                                   → { authenticated, displayName }
//   submitScore({ leaderboardId, score, context })   → envoi du score + configuration
//   loadEntries({ leaderboardId, scope, start, length })
//        → { entries: [{ rank, score, context, name, local }], local, total }
import Foundation
import Capacitor
import GameKit

@objc(GameCenterPlugin)
public class GameCenterPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GameCenterPlugin"
    public let jsName = "GameCenter"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "submitScore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "loadEntries", returnType: CAPPluginReturnPromise),
    ]

    private var pendingAuth: [CAPPluginCall] = []
    private var handlerInstalled = false

    private func authResult(_ error: Error? = nil) -> [String: Any] {
        let local = GKLocalPlayer.local
        return [
            "authenticated": local.isAuthenticated,
            "displayName": local.isAuthenticated ? local.displayName : "",
            "error": error?.localizedDescription ?? "",
        ]
    }

    @objc func authenticate(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let local = GKLocalPlayer.local
            if local.isAuthenticated { call.resolve(self.authResult()); return }
            // Gestionnaire déjà en place et joueur non connecté : réponse immédiate.
            if self.handlerInstalled { call.resolve(self.authResult()); return }
            self.handlerInstalled = true
            self.pendingAuth.append(call)
            local.authenticateHandler = { [weak self] viewController, error in
                guard let self = self else { return }
                if let vc = viewController {
                    self.bridge?.viewController?.present(vc, animated: true)
                    return
                }
                let result = self.authResult(error)
                let calls = self.pendingAuth
                self.pendingAuth = []
                calls.forEach { $0.resolve(result) }
            }
        }
    }

    @objc func submitScore(_ call: CAPPluginCall) {
        guard let id = call.getString("leaderboardId"), let score = call.getInt("score") else {
            call.reject("Paramètres manquants"); return
        }
        let context = call.getInt("context") ?? 0
        GKLeaderboard.submitScore(score, context: context, player: GKLocalPlayer.local, leaderboardIDs: [id]) { error in
            if let error = error { call.reject(error.localizedDescription) } else { call.resolve() }
        }
    }

    @objc func loadEntries(_ call: CAPPluginCall) {
        guard let id = call.getString("leaderboardId") else { call.reject("Classement manquant"); return }
        let scope: GKLeaderboard.PlayerScope = call.getString("scope") == "friends" ? .friendsOnly : .global
        let start = max(1, call.getInt("start") ?? 1)
        let length = min(100, max(1, call.getInt("length") ?? 50))
        GKLeaderboard.loadLeaderboards(IDs: [id]) { boards, error in
            guard let board = boards?.first else {
                call.reject(error?.localizedDescription ?? "Classement introuvable"); return
            }
            board.loadEntries(for: scope, timeScope: .allTime, range: NSRange(location: start, length: length)) { localEntry, entries, total, error in
                if let error = error { call.reject(error.localizedDescription); return }
                let me = GKLocalPlayer.local.gamePlayerID
                func row(_ e: GKLeaderboard.Entry) -> [String: Any] {
                    return ["rank": e.rank, "score": e.score, "context": e.context,
                            "name": e.player.displayName, "local": e.player.gamePlayerID == me]
                }
                var out: [String: Any] = ["entries": (entries ?? []).map(row), "total": total]
                if let l = localEntry { out["local"] = row(l) }
                call.resolve(out)
            }
        }
    }
}
