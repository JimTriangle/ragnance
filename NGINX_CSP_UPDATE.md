# Mise à jour de la configuration Nginx pour CSP

## Problème résolu

Ce document décrit la solution au problème de violation de Content Security Policy (CSP) qui bloquait le chargement des feuilles de style PrimeReact depuis unpkg.com :

```
Loading the stylesheet 'https://unpkg.com/primereact/resources/themes/vela-blue/theme.css'
violates the following Content Security Policy directive: "style-src 'self' 'unsafe-inline'".
```

## Solution implémentée

La configuration nginx a été mise à jour pour inclure des en-têtes de sécurité appropriés, notamment une politique CSP qui autorise le chargement des styles depuis unpkg.com tout en maintenant un niveau de sécurité élevé.

### Modifications apportées

Le fichier `ragnance` (configuration nginx) a été mis à jour avec les en-têtes de sécurité suivants :

1. **Content-Security-Policy** : Définit les sources autorisées pour différents types de contenu
   - `style-src 'self' 'unsafe-inline' https://unpkg.com` : Autorise les styles locaux, inline et depuis unpkg.com

2. **X-Frame-Options** : Protège contre le clickjacking

3. **X-Content-Type-Options** : Prévient le MIME type sniffing

4. **X-XSS-Protection** : Active la protection XSS du navigateur

5. **Referrer-Policy** : Contrôle les informations envoyées dans l'en-tête Referer

## Déploiement

Pour appliquer cette configuration sur le serveur de production :

```bash
# 1. Copier le fichier de configuration mis à jour
sudo cp ragnance /etc/nginx/sites-available/ragnance

# 2. Vérifier la syntaxe de la configuration
sudo nginx -t

# 3. Si la vérification est réussie, recharger nginx
sudo systemctl reload nginx
```

## Vérification

Après le déploiement, vérifiez que :

1. Le site web se charge correctement
2. Les thèmes PrimeReact (saga-blue et vela-blue) se chargent sans erreur CSP
3. Aucune autre ressource n'est bloquée

Vous pouvez vérifier les en-têtes de sécurité avec :

```bash
curl -I https://ragnance.fr
```

## Notes de sécurité

- La directive `'unsafe-inline'` pour `script-src` et `style-src` est nécessaire pour le fonctionnement de React et PrimeReact
- Seul le domaine `https://unpkg.com` est autorisé pour les styles externes (pour les thèmes PrimeReact)
- Les connexions API sont limitées aux domaines ragnance.fr et www.ragnance.fr
- Le chargement dans une iframe est complètement bloqué (`frame-ancestors 'none'`)

## Alternative future (optionnel)

Pour une sécurité maximale, vous pourriez envisager de :

1. Télécharger les thèmes PrimeReact localement dans `client/public/themes/`
2. Servir ces fichiers depuis votre propre domaine
3. Retirer `https://unpkg.com` de la directive `style-src`

Cela éliminerait complètement la dépendance à un CDN externe.
