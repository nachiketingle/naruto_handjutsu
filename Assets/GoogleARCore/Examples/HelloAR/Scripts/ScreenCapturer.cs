using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class ScreenCapturer : MonoBehaviour
{

    public Text debugText;
    GoogleARCore.CameraImageBytes bytes;


    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        bytes = GoogleARCore.Frame.CameraImage.AcquireCameraImageBytes();

        debugText.text = bytes.IsAvailable.ToString();

    }
}
